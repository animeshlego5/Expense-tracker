"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { rupeesToPaise } from "@/lib/currency";
import { requireUser } from "@/lib/session";

export type FormState = { error: string } | { ok: true };

const MIN_BUDGET_PAISE = 100_000; // ₹1,000
const MAX_BUDGET_PAISE = 10_000_000_000; // ₹10,00,00,000

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
