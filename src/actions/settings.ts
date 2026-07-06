"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { rupeesToPaise } from "@/lib/currency";
import { requireUser } from "@/lib/session";

export type FormState = { error: string } | { ok: true };

const MIN_BUDGET_PAISE = 100_000; // ₹1,000
const MAX_BUDGET_PAISE = 1_000_000_000; // ₹1 crore — stays within the int4 paise column

export async function updateBudget(
  _prev: FormState | null,
  formData: FormData
): Promise<FormState> {
  const session = await requireUser();
  const amountPaise = rupeesToPaise(String(formData.get("amount") ?? ""));
  if (amountPaise === null) return { error: "Enter a valid amount." };
  if (amountPaise < MIN_BUDGET_PAISE) {
    return { error: "Budget must be at least ₹1,000." };
  }
  if (amountPaise > MAX_BUDGET_PAISE) {
    return { error: "That budget is too large." };
  }

  await db
    .insert(userSettings)
    .values({ userId: session.user.id, monthlyBudgetPaise: amountPaise })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { monthlyBudgetPaise: amountPaise, updatedAt: new Date() },
    });

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { ok: true };
}

// Expected monthly income. Empty input clears the target (null).
export async function updateIncomeTarget(
  _prev: FormState | null,
  formData: FormData
): Promise<FormState> {
  const session = await requireUser();
  const raw = String(formData.get("amount") ?? "").trim();

  let targetPaise: number | null = null;
  if (raw.length > 0) {
    const parsed = rupeesToPaise(raw);
    if (parsed === null || parsed <= 0) return { error: "Enter a valid amount." };
    if (parsed > MAX_BUDGET_PAISE) return { error: "That amount is too large." };
    targetPaise = parsed;
  }

  await db
    .insert(userSettings)
    .values({ userId: session.user.id, monthlyIncomeTargetPaise: targetPaise })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { monthlyIncomeTargetPaise: targetPaise, updatedAt: new Date() },
    });

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { ok: true };
}

// Student mode: hide income tracking everywhere. Called directly from the
// toggle's event handler; the layout revalidation refreshes nav + dashboard.
export async function setHideIncome(hide: boolean): Promise<void> {
  const session = await requireUser();

  await db
    .insert(userSettings)
    .values({ userId: session.user.id, hideIncome: hide })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { hideIncome: hide, updatedAt: new Date() },
    });

  revalidatePath("/", "layout");
}
