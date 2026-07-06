import Link from "next/link";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { deleteExpense } from "@/actions/expenses";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { categoryColor, categoryLabel } from "@/lib/categories";
import { formatPaise } from "@/lib/currency";
import {
  addMonths,
  dayLabel,
  istCurrentMonth,
  istToday,
  monthLabel,
  monthRange,
} from "@/lib/dates";
import { requireUser } from "@/lib/session";

const MONTH_RE = /^\d{4}-\d{2}$/;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; edit?: string }>;
}) {
  const session = await requireUser();
  const userId = session.user.id;
  const sp = await searchParams;
  const month = sp.month && MONTH_RE.test(sp.month) ? sp.month : istCurrentMonth();
  const { start, end } = monthRange(month);

  const rows = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        gte(expenses.occurredOn, start),
        lt(expenses.occurredOn, end)
      )
    )
    .orderBy(desc(expenses.occurredOn), desc(expenses.createdAt));

  const total = rows.reduce((s, r) => s + r.amountPaise, 0);
  const editRow = sp.edit ? rows.find((r) => r.id === sp.edit) : undefined;

  const today = istToday();
  const atCurrent = month >= istCurrentMonth();

  // Group by day, preserving the desc order already applied by the query.
  const groups: { date: string; rows: typeof rows }[] = [];
  for (const r of rows) {
    const last = groups[groups.length - 1];
    if (last && last.date === r.occurredOn) last.rows.push(r);
    else groups.push({ date: r.occurredOn, rows: [r] });
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">{monthLabel(month)}</h1>
          <p className="text-sm text-ink-soft">Total {formatPaise(total)}</p>
        </div>
        <nav className="flex items-center gap-1">
          <Link
            href={`/expenses?month=${addMonths(month, -1)}`}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline text-ink"
          >
            ‹
          </Link>
          {atCurrent ? (
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline text-ink-soft/40"
            >
              ›
            </span>
          ) : (
            <Link
              href={`/expenses?month=${addMonths(month, 1)}`}
              aria-label="Next month"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline text-ink"
            >
              ›
            </Link>
          )}
        </nav>
      </header>

      {editRow ? (
        <ExpenseForm
          key={editRow.id}
          today={today}
          cancelHref={`/expenses?month=${month}`}
          initial={{
            id: editRow.id,
            amountPaise: editRow.amountPaise,
            category: editRow.category,
            note: editRow.note,
            occurredOn: editRow.occurredOn,
          }}
        />
      ) : (
        <ExpenseForm key="add" today={today} />
      )}

      {groups.length === 0 ? (
        <p className="text-ink-soft">No expenses in {monthLabel(month)}.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => {
            const dayTotal = g.rows.reduce((s, r) => s + r.amountPaise, 0);
            return (
              <section key={g.date} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-sm font-medium text-ink-soft">
                    {dayLabel(g.date)}
                  </h2>
                  <span className="text-sm tabular-nums text-ink-soft">
                    {formatPaise(dayTotal)}
                  </span>
                </div>
                <ul className="flex flex-col divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
                  {g.rows.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: categoryColor(r.category) }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-ink">
                          {categoryLabel(r.category)}
                        </p>
                        {r.note && (
                          <p className="truncate text-sm text-ink-soft">
                            {r.note}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 tabular-nums text-ink">
                        {formatPaise(r.amountPaise)}
                      </span>
                      <Link
                        href={`/expenses?month=${month}&edit=${r.id}`}
                        className="shrink-0 text-sm text-ink-soft underline"
                      >
                        Edit
                      </Link>
                      <form action={deleteExpense} className="shrink-0">
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          type="submit"
                          aria-label="Delete expense"
                          className="flex text-ink-soft transition-colors hover:text-critical"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
