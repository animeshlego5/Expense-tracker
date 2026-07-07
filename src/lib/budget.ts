// Pure run-rate projection — no I/O, trivially testable.
//
// Fixed costs (rent, bills, subscriptions) are paid as a monthly lump, so
// scaling them by days-elapsed would wildly over-project early in the month
// (₹15k rent on day 1 would read as ₹15k/day). Only variable spend (food,
// travel, other) is run-rate projected; fixed costs are added flat, plus the
// expected cost of active subscriptions that haven't posted yet this month.

export const DEFAULT_BUDGET_PAISE = 2_000_000; // ₹20,000

export type BudgetStatus = "ok" | "at-risk" | "over";

export interface BudgetProjection {
  /** Projected month-end spend: fixed (actual + expected) + projected variable. */
  projectedPaise: number;
  /** Actual money spent so far this month (fixed + variable, logged only). */
  actualSpendPaise: number;
  status: BudgetStatus;
  /** How far over budget: actual overspend when "over", projected when "at-risk", else 0. */
  overspendPaise: number;
}

export function computeBudget(input: {
  /** Logged spend this month in variable categories (food, travel, other). */
  variableSpendPaise: number;
  /** Logged spend this month in fixed categories (rent, bills, subscriptions). */
  fixedSpendPaise: number;
  /** Active subscriptions not yet posted this month — expected but unpaid fixed cost. */
  expectedFixedPaise: number;
  budgetPaise: number;
  daysElapsed: number; // IST day-of-month, >= 1
  daysInMonth: number;
}): BudgetProjection {
  const {
    variableSpendPaise,
    fixedSpendPaise,
    expectedFixedPaise,
    budgetPaise,
    daysElapsed,
    daysInMonth,
  } = input;

  const actualSpendPaise = fixedSpendPaise + variableSpendPaise;

  const projectedVariable =
    daysElapsed > 0
      ? Math.round((variableSpendPaise * daysInMonth) / daysElapsed)
      : variableSpendPaise;

  const projectedPaise =
    fixedSpendPaise + expectedFixedPaise + projectedVariable;

  let status: BudgetStatus = "ok";
  if (actualSpendPaise > budgetPaise) {
    // Already over — always critical, even on day 1.
    status = "over";
  } else if (
    actualSpendPaise > 0 &&
    projectedPaise > budgetPaise &&
    daysElapsed >= 3
  ) {
    // Grace window: before day 3 a single big variable purchase would
    // project 10–31x. The projection still shows as a stat; the banner waits.
    status = "at-risk";
  }

  const overspendPaise =
    status === "over"
      ? actualSpendPaise - budgetPaise
      : status === "at-risk"
        ? projectedPaise - budgetPaise
        : 0;

  return { projectedPaise, actualSpendPaise, status, overspendPaise };
}
