import { formatPaise } from "@/lib/currency";
import type { BudgetStatus } from "@/lib/budget";

export function BudgetBanner({
  status,
  spendPaise,
  budgetPaise,
  projectedPaise,
  overspendPaise,
}: {
  status: Exclude<BudgetStatus, "ok">;
  spendPaise: number;
  budgetPaise: number;
  projectedPaise: number;
  overspendPaise: number;
}) {
  const isOver = status === "over";
  const lead = isOver ? "Over budget" : "Heads up";
  const message = isOver
    ? `You've spent ${formatPaise(spendPaise)} — ${formatPaise(
        overspendPaise
      )} over your ${formatPaise(budgetPaise)} budget.`
    : `At this pace you'll spend ${formatPaise(
        projectedPaise
      )} by month end (${formatPaise(overspendPaise)} over budget).`;

  return (
    <div
      role="alert"
      className={`w-full rounded-2xl border p-4 ${
        isOver
          ? "border-critical/40 bg-critical/10"
          : "border-warning/50 bg-warning/15"
      }`}
    >
      <p className="text-sm text-ink">
        <span
          aria-hidden="true"
          className={`mr-1.5 font-semibold ${
            isOver ? "text-critical" : "text-warning"
          }`}
        >
          ⚠
        </span>
        <span
          className={`font-semibold ${isOver ? "text-critical" : "text-ink"}`}
        >
          {lead}
        </span>{" "}
        {message}
      </p>
    </div>
  );
}
