import { and, desc, eq, gte, lt, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import {
  categoryBudgets,
  expenses,
  incomes,
  subscriptions,
  userSettings,
} from "@/db/schema";
import { requireUser } from "@/lib/session";
import { formatPaise } from "@/lib/currency";
import { CATEGORIES, isFixedCategory } from "@/lib/categories";
import { syncDueSubscriptions } from "@/lib/subscriptions";
import {
  daysInMonth,
  istCurrentMonth,
  istDayOfMonth,
  monthRange,
  monthShortLabel,
  trailingMonths,
} from "@/lib/dates";
import { computeBudget, DEFAULT_BUDGET_PAISE } from "@/lib/budget";
import { StatTile } from "@/components/dashboard/StatTile";
import { BudgetBanner } from "@/components/dashboard/BudgetBanner";
import { CategoryPie } from "@/components/dashboard/CategoryPie";
import { MonthlyTracker } from "@/components/dashboard/MonthlyTracker";
import { RecentExpenses } from "@/components/dashboard/RecentExpenses";

export default async function DashboardPage() {
  const session = await requireUser();
  const userId = session.user.id;

  const month = istCurrentMonth();
  const { start, end } = monthRange(month);

  // Post any due recurring subscriptions before reading this month's expenses,
  // so the dashboard reflects them immediately (the no-cron catch-up pattern).
  await syncDueSubscriptions(userId);

  // 6-month window (oldest first) for the tracker.
  const months = trailingMonths(6, month);
  const seriesStart = monthRange(months[0]).start;
  const seriesEnd = monthRange(months[months.length - 1]).end;

  // occurred_on is a date column; ::text yields 'YYYY-MM-DD', substr → 'YYYY-MM'.
  const expenseMonth = sql<string>`substr(${expenses.occurredOn}::text, 1, 7)`;
  const incomeMonth = sql<string>`substr(${incomes.occurredOn}::text, 1, 7)`;

  const monthExpenses = and(
    eq(expenses.userId, userId),
    gte(expenses.occurredOn, start),
    lt(expenses.occurredOn, end)
  );

  const [
    expenseTotalRows,
    incomeTotalRows,
    categoryRows,
    settingsRows,
    recentRows,
    expenseSeriesRows,
    incomeSeriesRows,
    categoryBudgetRows,
    activeSubRows,
  ] = await Promise.all([
    db.select({ total: sum(expenses.amountPaise) }).from(expenses).where(monthExpenses),
    db
      .select({ total: sum(incomes.amountPaise) })
      .from(incomes)
      .where(
        and(
          eq(incomes.userId, userId),
          gte(incomes.occurredOn, start),
          lt(incomes.occurredOn, end)
        )
      ),
    db
      .select({ category: expenses.category, total: sum(expenses.amountPaise) })
      .from(expenses)
      .where(monthExpenses)
      .groupBy(expenses.category),
    db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1),
    db
      .select({
        id: expenses.id,
        category: expenses.category,
        note: expenses.note,
        occurredOn: expenses.occurredOn,
        amountPaise: expenses.amountPaise,
      })
      .from(expenses)
      .where(monthExpenses)
      .orderBy(desc(expenses.occurredOn), desc(expenses.createdAt))
      .limit(5),
    db
      .select({ month: expenseMonth, total: sum(expenses.amountPaise) })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.occurredOn, seriesStart),
          lt(expenses.occurredOn, seriesEnd)
        )
      )
      .groupBy(expenseMonth),
    db
      .select({ month: incomeMonth, total: sum(incomes.amountPaise) })
      .from(incomes)
      .where(
        and(
          eq(incomes.userId, userId),
          gte(incomes.occurredOn, seriesStart),
          lt(incomes.occurredOn, seriesEnd)
        )
      )
      .groupBy(incomeMonth),
    db
      .select()
      .from(categoryBudgets)
      .where(eq(categoryBudgets.userId, userId)),
    db
      .select({
        amountPaise: subscriptions.amountPaise,
        lastPostedMonth: subscriptions.lastPostedMonth,
      })
      .from(subscriptions)
      .where(
        and(eq(subscriptions.userId, userId), eq(subscriptions.active, true))
      ),
  ]);

  const spendPaise = Number(expenseTotalRows[0]?.total ?? 0);
  const incomePaise = Number(incomeTotalRows[0]?.total ?? 0);
  const settings = settingsRows[0];
  const budgetPaise = settings?.monthlyBudgetPaise ?? DEFAULT_BUDGET_PAISE;
  const incomeTargetPaise = settings?.monthlyIncomeTargetPaise ?? null;
  const hideIncome = settings?.hideIncome ?? false;

  // Category slices in fixed CATEGORIES order, only those with spend.
  // A slice is "overspent" when its month total exceeds its per-category cap.
  const categoryTotals = new Map<string, number>();
  for (const row of categoryRows) {
    categoryTotals.set(row.category, Number(row.total ?? 0));
  }
  const capByCategory = new Map(
    categoryBudgetRows.map((row) => [row.category, row.monthlyBudgetPaise])
  );
  const pieData = CATEGORIES.map((c) => {
    const value = categoryTotals.get(c.key) ?? 0;
    const cap = capByCategory.get(c.key);
    return {
      key: c.key,
      label: c.label,
      short: c.short,
      value,
      color: c.color,
      overByPaise: cap !== undefined && value > cap ? value - cap : 0,
    };
  }).filter((d) => d.value > 0);

  // Assemble the 6-month series; missing months = 0.
  const expenseByMonth = new Map<string, number>();
  for (const row of expenseSeriesRows) {
    expenseByMonth.set(row.month, Number(row.total ?? 0));
  }
  const incomeByMonth = new Map<string, number>();
  for (const row of incomeSeriesRows) {
    incomeByMonth.set(row.month, Number(row.total ?? 0));
  }
  const series = months.map((m) => ({
    month: m,
    label: monthShortLabel(m),
    incomePaise: incomeByMonth.get(m) ?? 0,
    expensePaise: expenseByMonth.get(m) ?? 0,
  }));

  // Split logged spend into fixed (rent/bills/subscriptions — added flat) and
  // variable (food/travel/other — run-rate projected). Expected fixed cost =
  // active subscriptions that haven't posted yet this month, so a bill due
  // later in the month is counted in the projection before it's paid.
  let fixedSpendPaise = 0;
  for (const row of categoryRows) {
    if (isFixedCategory(row.category)) fixedSpendPaise += Number(row.total ?? 0);
  }
  const variableSpendPaise = spendPaise - fixedSpendPaise;
  const expectedFixedPaise = activeSubRows
    .filter((s) => s.lastPostedMonth !== month)
    .reduce((sum, s) => sum + s.amountPaise, 0);

  const daysElapsed = istDayOfMonth();
  const totalDays = daysInMonth(month);
  const budget = computeBudget({
    variableSpendPaise,
    fixedSpendPaise,
    expectedFixedPaise,
    budgetPaise,
    daysElapsed,
    daysInMonth: totalDays,
  });

  // Red + up-arrow whenever the pace overshoots the budget; green when safe.
  const overPace = budget.projectedPaise > budgetPaise;

  // Income above the user's monthly target renders as a gain.
  const incomeGainPaise =
    incomeTargetPaise !== null && incomePaise > incomeTargetPaise
      ? incomePaise - incomeTargetPaise
      : null;

  return (
    <div className="space-y-4">
      {budget.status !== "ok" && (
        <BudgetBanner
          status={budget.status}
          spendPaise={spendPaise}
          budgetPaise={budgetPaise}
          projectedPaise={budget.projectedPaise}
          overspendPaise={budget.overspendPaise}
        />
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          hero
          label="Spent this month"
          value={formatPaise(spendPaise)}
          hint={`${daysElapsed}/${totalDays}`}
        />
        {!hideIncome && (
          <StatTile
            label="Income this month"
            value={formatPaise(incomePaise)}
            tone={incomeGainPaise !== null ? "positive" : undefined}
            extra={
              incomeGainPaise !== null
                ? `(+${formatPaise(incomeGainPaise)})`
                : undefined
            }
          />
        )}
        <StatTile
          label="On pace for"
          value={formatPaise(budget.projectedPaise)}
          tone={overPace ? "critical" : "positive"}
          trendUp={overPace}
        />
      </section>

      <CategoryPie
        data={pieData}
        totalPaise={spendPaise}
        totalLabel={formatPaise(spendPaise)}
      />

      <RecentExpenses expenses={recentRows} />

      <MonthlyTracker data={series} showIncome={!hideIncome} />
    </div>
  );
}
