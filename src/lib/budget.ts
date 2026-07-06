// Pure run-rate projection — no I/O, trivially testable.

export const DEFAULT_BUDGET_PAISE = 2_000_000; // ₹20,000

export type BudgetStatus = "ok" | "at-risk" | "over";

export interface BudgetProjection {
  /** Projected month-end spend at the current pace. */
  projectedPaise: number;
  status: BudgetStatus;
  /** How far over budget: actual overspend when "over", projected when "at-risk", else 0. */
  overspendPaise: number;
}

export function computeBudget(input: {
  spendPaise: number;
  budgetPaise: number;
  daysElapsed: number; // IST day-of-month, >= 1
  daysInMonth: number;
}): BudgetProjection {
  const { spendPaise, budgetPaise, daysElapsed, daysInMonth } = input;

  const projectedPaise =
    daysElapsed > 0
      ? Math.round((spendPaise * daysInMonth) / daysElapsed)
      : spendPaise;

  let status: BudgetStatus = "ok";
  if (spendPaise > budgetPaise) {
    // Already over — always critical, even on day 1.
    status = "over";
  } else if (spendPaise > 0 && projectedPaise > budgetPaise && daysElapsed >= 3) {
    // Grace window: before day 3 a single dinner would project 10–31x.
    // The projection is still displayed as a stat; only the banner waits.
    status = "at-risk";
  }

  const overspendPaise =
    status === "over"
      ? spendPaise - budgetPaise
      : status === "at-risk"
        ? projectedPaise - budgetPaise
        : 0;

  return { projectedPaise, status, overspendPaise };
}
