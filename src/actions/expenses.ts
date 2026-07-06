"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { CATEGORY_KEYS, type ExpenseCategory } from "@/lib/categories";
import { rupeesToPaise } from "@/lib/currency";
import { istToday } from "@/lib/dates";
import { requireUser } from "@/lib/session";

export type FormState = { error: string } | { ok: true };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_AMOUNT_PAISE = 1_000_000_000; // ₹1 crore — stays within the int4 paise column

const fieldsSchema = z.object({
  category: z.enum(CATEGORY_KEYS),
  note: z.string().trim().max(200, "Note must be 200 characters or fewer."),
  occurredOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")
    .refine((d) => d <= istToday(), "Date can't be in the future."),
});

type ExpenseData = {
  amountPaise: number;
  category: ExpenseCategory;
  note: string | null;
  occurredOn: string;
};

function parseExpense(
  formData: FormData
): { error: string } | { data: ExpenseData } {
  const amountPaise = rupeesToPaise(String(formData.get("amount") ?? ""));
  if (amountPaise === null || amountPaise <= 0) {
    return { error: "Enter an amount greater than ₹0." };
  }
  if (amountPaise > MAX_AMOUNT_PAISE) {
    return { error: "Amount can't exceed ₹1,00,00,000." };
  }
  const parsed = fieldsSchema.safeParse({
    category: formData.get("category"),
    note: String(formData.get("note") ?? ""),
    occurredOn: formData.get("occurredOn"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  return {
    data: {
      amountPaise,
      category: parsed.data.category,
      note: parsed.data.note.length > 0 ? parsed.data.note : null,
      occurredOn: parsed.data.occurredOn,
    },
  };
}

function parseId(formData: FormData): string | null {
  const id = formData.get("id");
  return typeof id === "string" && UUID_RE.test(id) ? id : null;
}

function revalidate() {
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
}

export async function addExpense(
  _prev: FormState | null,
  formData: FormData
): Promise<FormState> {
  const session = await requireUser();
  const result = parseExpense(formData);
  if ("error" in result) return { error: result.error };

  await db.insert(expenses).values({ userId: session.user.id, ...result.data });
  revalidate();
  return { ok: true };
}

export async function updateExpense(
  _prev: FormState | null,
  formData: FormData
): Promise<FormState> {
  const session = await requireUser();
  const id = parseId(formData);
  if (!id) return { error: "Missing or invalid id." };
  const result = parseExpense(formData);
  if ("error" in result) return { error: result.error };

  await db
    .update(expenses)
    .set(result.data)
    .where(and(eq(expenses.id, id), eq(expenses.userId, session.user.id)));
  revalidate();
  return { ok: true };
}

// Bound directly to <form action={deleteExpense}> (no useActionState), so this
// returns void to satisfy React's form-action type; nothing consumes a result.
export async function deleteExpense(formData: FormData): Promise<void> {
  const session = await requireUser();
  const id = parseId(formData);
  if (!id) return;

  await db
    .delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, session.user.id)));
  revalidate();
}
