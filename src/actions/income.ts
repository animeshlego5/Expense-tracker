"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { incomes } from "@/db/schema";
import { rupeesToPaise } from "@/lib/currency";
import { istToday } from "@/lib/dates";
import { requireUser } from "@/lib/session";

export type FormState = { error: string } | { ok: true };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fieldsSchema = z.object({
  source: z
    .string()
    .trim()
    .min(1, "Enter a source.")
    .max(100, "Source must be 100 characters or fewer."),
  occurredOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")
    .refine((d) => d <= istToday(), "Date can't be in the future."),
});

type IncomeData = {
  amountPaise: number;
  source: string;
  occurredOn: string;
};

function parseIncome(
  formData: FormData
): { error: string } | { data: IncomeData } {
  const amountPaise = rupeesToPaise(String(formData.get("amount") ?? ""));
  if (amountPaise === null || amountPaise <= 0) {
    return { error: "Enter an amount greater than ₹0." };
  }
  const parsed = fieldsSchema.safeParse({
    source: String(formData.get("source") ?? ""),
    occurredOn: formData.get("occurredOn"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  return {
    data: {
      amountPaise,
      source: parsed.data.source,
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
  revalidatePath("/income");
}

export async function addIncome(
  _prev: FormState | null,
  formData: FormData
): Promise<FormState> {
  const session = await requireUser();
  const result = parseIncome(formData);
  if ("error" in result) return { error: result.error };

  await db.insert(incomes).values({ userId: session.user.id, ...result.data });
  revalidate();
  return { ok: true };
}

export async function updateIncome(
  _prev: FormState | null,
  formData: FormData
): Promise<FormState> {
  const session = await requireUser();
  const id = parseId(formData);
  if (!id) return { error: "Missing or invalid id." };
  const result = parseIncome(formData);
  if ("error" in result) return { error: result.error };

  await db
    .update(incomes)
    .set(result.data)
    .where(and(eq(incomes.id, id), eq(incomes.userId, session.user.id)));
  revalidate();
  return { ok: true };
}

// Bound directly to <form action={deleteIncome}> (no useActionState), so this
// returns void to satisfy React's form-action type; nothing consumes a result.
export async function deleteIncome(formData: FormData): Promise<void> {
  const session = await requireUser();
  const id = parseId(formData);
  if (!id) return;

  await db
    .delete(incomes)
    .where(and(eq(incomes.id, id), eq(incomes.userId, session.user.id)));
  revalidate();
}
