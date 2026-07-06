// All calendar math is anchored to IST (Asia/Kolkata) regardless of server TZ.
// Vercel functions run in UTC; never use new Date().toISOString().slice(0, 10)
// for "today" — IST evenings would land on the wrong day.

const IST = "Asia/Kolkata";

const istDateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: IST,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's IST calendar date as 'YYYY-MM-DD'. */
export function istToday(): string {
  return istDateFmt.format(new Date());
}

/** Current IST month as 'YYYY-MM'. */
export function istCurrentMonth(): string {
  return istToday().slice(0, 7);
}

/** IST day-of-month (1–31). */
export function istDayOfMonth(): number {
  return Number(istToday().slice(8, 10));
}

/** Number of days in a 'YYYY-MM' month. */
export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Half-open date range [start, end) covering a 'YYYY-MM' month. */
export function monthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  const next =
    m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return { start: `${month}-01`, end: `${next}-01` };
}

/** Shift a 'YYYY-MM' month by delta months (delta may be negative). */
export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const idx = y * 12 + (m - 1) + delta;
  const ny = Math.floor(idx / 12);
  const nm = (idx % 12 + 12) % 12 + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

/** Human label for a 'YYYY-MM' month, e.g. "July 2026". */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

/** Short label for chart ticks, e.g. "Jul". */
export function monthShortLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

/** The trailing n months ending at endMonth (inclusive), oldest first. */
export function trailingMonths(
  n: number,
  endMonth: string = istCurrentMonth()
): string[] {
  return Array.from({ length: n }, (_, i) => addMonths(endMonth, i - (n - 1)));
}

/** Human label for a 'YYYY-MM-DD' day, e.g. "Mon, 6 Jul". */
export function dayLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}
