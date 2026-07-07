// Server-only module (imports the DB). Not marked with the `server-only`
// package since it isn't a dependency; only imported from server code.
import { and, eq, isNull, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { expenses, subscriptions } from "@/db/schema";
import { daysInMonth, istCurrentMonth, istDayOfMonth } from "@/lib/dates";

/** The day a subscription bills this month, clamped to the month's length
 *  (a "31st" subscription bills on the 28th/30th in shorter months). */
export function billingDay(dayOfMonth: number, month: string): number {
  return Math.min(dayOfMonth, daysInMonth(month));
}

/**
 * Lazily materialize due subscriptions into expense rows — the pragmatic
 * no-cron pattern: called on dashboard load, idempotent, safe to run often.
 *
 * For each active subscription whose billing day has arrived this month and
 * which hasn't posted yet, we atomically "claim" the month via a conditional
 * UPDATE (RETURNING) and only then insert the expense. Claim-then-insert means
 * the worst case under a race is a missed post, never a duplicate.
 */
export async function syncDueSubscriptions(userId: string): Promise<void> {
  const month = istCurrentMonth();
  const today = istDayOfMonth();

  const active = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.active, true),
        // Not yet posted this month (null = never posted).
        or(
          isNull(subscriptions.lastPostedMonth),
          ne(subscriptions.lastPostedMonth, month)
        )
      )
    );

  for (const sub of active) {
    if (billingDay(sub.dayOfMonth, month) > today) continue; // not due yet

    // Atomically claim this month. If another concurrent load already claimed
    // it, no row comes back and we skip the insert.
    const claimed = await db
      .update(subscriptions)
      .set({ lastPostedMonth: month, updatedAt: new Date() })
      .where(
        and(
          eq(subscriptions.id, sub.id),
          eq(subscriptions.userId, userId),
          or(
            isNull(subscriptions.lastPostedMonth),
            ne(subscriptions.lastPostedMonth, month)
          )
        )
      )
      .returning({ id: subscriptions.id });

    if (claimed.length === 0) continue;

    const occurredOn = `${month}-${String(
      billingDay(sub.dayOfMonth, month)
    ).padStart(2, "0")}`;
    await db.insert(expenses).values({
      userId,
      amountPaise: sub.amountPaise,
      category: sub.category,
      note: sub.name,
      occurredOn,
    });
  }
}
