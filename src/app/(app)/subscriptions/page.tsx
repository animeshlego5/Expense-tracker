import { asc, desc, eq } from "drizzle-orm";
import { deleteSubscription } from "@/actions/subscriptions";
import { SubscriptionForm } from "@/components/forms/SubscriptionForm";
import { SubscriptionToggle } from "@/components/forms/SubscriptionToggle";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { categoryColor, categoryLabel } from "@/lib/categories";
import { formatPaise } from "@/lib/currency";
import { requireUser } from "@/lib/session";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await requireUser();
  const userId = session.user.id;
  const sp = await searchParams;

  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.active), asc(subscriptions.dayOfMonth));

  const editRow = sp.edit ? rows.find((r) => r.id === sp.edit) : undefined;
  const activeMonthlyPaise = rows
    .filter((r) => r.active)
    .reduce((sum, r) => sum + r.amountPaise, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Subscriptions</h1>
        <p className="text-sm text-ink-soft">
          Recurring costs post automatically each month on their billing day.
          Pause one to stop it without losing history.
        </p>
      </div>

      {editRow ? (
        <SubscriptionForm
          key={editRow.id}
          cancelHref="/subscriptions"
          initial={{
            id: editRow.id,
            name: editRow.name,
            amountPaise: editRow.amountPaise,
            category: editRow.category,
            dayOfMonth: editRow.dayOfMonth,
          }}
        />
      ) : (
        <SubscriptionForm key="add" />
      )}

      {rows.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-ink">Your subscriptions</h2>
            <span className="text-sm text-ink-soft">
              {formatPaise(activeMonthlyPaise)}/mo active
            </span>
          </div>

          <ul className="flex flex-col gap-2">
            {rows.map((r) => (
              <li
                key={r.id}
                className={`flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-3 ${
                  r.active ? "" : "opacity-60"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded"
                  style={{ backgroundColor: categoryColor(r.category) }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{r.name}</p>
                  <p className="text-xs text-ink-soft">
                    {categoryLabel(r.category)} · bills on the{" "}
                    {ordinal(r.dayOfMonth)}
                    {!r.active && " · paused"}
                  </p>
                </div>
                <span className="shrink-0 tabular-nums text-ink">
                  {formatPaise(r.amountPaise)}
                </span>
                <SubscriptionToggle id={r.id} initial={r.active} />
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <a
                    href={`/subscriptions?edit=${r.id}`}
                    className="text-xs text-ink-soft underline"
                  >
                    Edit
                  </a>
                  <form action={deleteSubscription}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="text-xs text-critical underline"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
