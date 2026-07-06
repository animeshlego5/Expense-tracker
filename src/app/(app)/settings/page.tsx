import { eq } from "drizzle-orm";
import { BudgetForm } from "@/components/forms/BudgetForm";
import { IncomeTargetForm } from "@/components/forms/IncomeTargetForm";
import { StudentToggle } from "@/components/forms/StudentToggle";
import { SignOutButton } from "@/components/nav/SignOutButton";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { DEFAULT_BUDGET_PAISE } from "@/lib/budget";
import { requireUser } from "@/lib/session";

export default async function SettingsPage() {
  const session = await requireUser();
  const userId = session.user.id;

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));
  const budgetPaise = settings?.monthlyBudgetPaise ?? DEFAULT_BUDGET_PAISE;
  const incomeTargetPaise = settings?.monthlyIncomeTargetPaise ?? null;
  const hideIncome = settings?.hideIncome ?? false;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold text-ink">Settings</h1>

      <section className="rounded-2xl border border-hairline bg-surface p-4">
        <p className="font-medium text-ink">{session.user.name}</p>
        <p className="text-sm text-ink-soft">{session.user.email}</p>
      </section>

      <BudgetForm currentPaise={budgetPaise} />

      <StudentToggle initial={hideIncome} />

      {!hideIncome && <IncomeTargetForm currentPaise={incomeTargetPaise} />}

      <SignOutButton />
    </div>
  );
}
