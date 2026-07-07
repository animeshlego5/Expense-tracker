"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { CATEGORY_KEYS, type ExpenseCategory } from "@/lib/categories";
import { rupeesToPaise } from "@/lib/currency";
import { requireUser } from "@/lib/session";
import { syncDueSubscriptions } from "@/lib/subscriptions";

export type FormState = { error: string } | { ok: true };

const MAX_AMOUNT_PAISE = 1_000_000_000; // ₹1 crore — within the int4 paise column

function parseFields(formData: FormData):
  | { error: string }
  | {
      name: string;
      amountPaise: number;
      category: ExpenseCategory;
      dayOfMonth: number;
    } {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length === 0) return { error: "Enter a name." };
  if (name.length > 100) return { error: "Name is too long." };

  const amountPaise = rupeesToPaise(String(formData.get("amount") ?? ""));
  if (amountPaise === null || amountPaise <= 0) {
    return { error: "Enter a valid amount." };
  }
  if (amountPaise > MAX_AMOUNT_PAISE) return { error: "That amount is too large." };

  const category = String(formData.get("category") ?? "");
  if (!(CATEGORY_KEYS as readonly string[]).includes(category)) {
    return { error: "Pick a category." };
  }

  const dayOfMonth = Number(formData.get("dayOfMonth"));
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    return { error: "Billing day must be between 1 and 31." };
  }

  return { name, amountPaise, category: category as ExpenseCategory, dayOfMonth };
}

export async function addSubscription(
  _prev: FormState | null,
  formData: FormData
): Promise<FormState> {
  const session = await requireUser();
  const parsed = parseFields(formData);
  if ("error" in parsed) return parsed;

  await db.insert(subscriptions).values({
    userId: session.user.id,
    name: parsed.name,
    amountPaise: parsed.amountPaise,
    category: parsed.category,
    dayOfMonth: parsed.dayOfMonth,
  });

  // Post immediately if its billing day has already passed this month.
  await syncDueSubscriptions(session.user.id);

  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateSubscription(
  _prev: FormState | null,
  formData: FormData
): Promise<FormState> {
  const session = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing subscription." };

  const parsed = parseFields(formData);
  if ("error" in parsed) return parsed;

  await db
    .update(subscriptions)
    .set({
      name: parsed.name,
      amountPaise: parsed.amountPaise,
      category: parsed.category,
      dayOfMonth: parsed.dayOfMonth,
      updatedAt: new Date(),
    })
    .where(
      and(eq(subscriptions.id, id), eq(subscriptions.userId, session.user.id))
    );

  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
  return { ok: true };
}

// Enable/disable. Disabling stops future auto-posting without deleting history.
export async function setSubscriptionActive(
  id: string,
  active: boolean
): Promise<void> {
  const session = await requireUser();
  await db
    .update(subscriptions)
    .set({ active, updatedAt: new Date() })
    .where(
      and(eq(subscriptions.id, id), eq(subscriptions.userId, session.user.id))
    );

  if (active) await syncDueSubscriptions(session.user.id);

  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
}

export async function deleteSubscription(formData: FormData): Promise<void> {
  const session = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db
    .delete(subscriptions)
    .where(
      and(eq(subscriptions.id, id), eq(subscriptions.userId, session.user.id))
    );

  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
}
