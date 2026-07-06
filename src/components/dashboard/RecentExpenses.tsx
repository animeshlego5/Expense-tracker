import Link from "next/link";
import { formatPaise } from "@/lib/currency";
import {
  categoryColor,
  categoryLabel,
  type ExpenseCategory,
} from "@/lib/categories";
import { dayLabel } from "@/lib/dates";

interface RecentExpenseRow {
  id: string;
  category: ExpenseCategory;
  note: string | null;
  occurredOn: string;
  amountPaise: number;
}

export function RecentExpenses({ expenses }: { expenses: RecentExpenseRow[] }) {
  return (
    <section className="rounded-2xl border border-hairline bg-surface p-4">
      <h2 className="text-base font-semibold text-ink">Recent</h2>

      {expenses.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">Nothing logged yet.</p>
      ) : (
        <ul className="mt-1 divide-y divide-hairline">
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-3">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: categoryColor(e.category) }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">
                  {categoryLabel(e.category)}
                  {e.note ? (
                    <span className="text-ink-soft"> · {e.note}</span>
                  ) : null}
                </p>
                <p className="text-xs text-ink-soft">{dayLabel(e.occurredOn)}</p>
              </div>
              <span className="shrink-0 text-sm tabular-nums text-ink">
                {formatPaise(e.amountPaise)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/expenses"
        className="mt-3 inline-block text-sm font-medium text-ink underline"
      >
        All expenses →
      </Link>
    </section>
  );
}
