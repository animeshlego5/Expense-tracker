"use client";

// Themed replacement for <input type="date"> — the native picker is browser
// chrome that can't be styled and spills over the layout. This renders an
// in-flow calendar (no overlay, nothing to clip) in the cream design system.
// Submits via a hidden input, so the form/action contract is unchanged.

import { useState } from "react";
import { addDays, addMonths, daysInMonth, monthLabel } from "@/lib/dates";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function fullDayLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function DateField({
  name,
  today,
  initial,
}: {
  name: string;
  /** IST today 'YYYY-MM-DD' (computed server-side). Future dates are disabled. */
  today: string;
  initial?: string;
}) {
  const [value, setValue] = useState(initial ?? today);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState((initial ?? today).slice(0, 7));

  const yesterday = addDays(today, -1);
  const currentMonth = today.slice(0, 7);

  function pick(date: string) {
    setValue(date);
    setViewMonth(date.slice(0, 7));
    setOpen(false);
  }

  const [vy, vm] = viewMonth.split("-").map(Number);
  const firstDow = new Date(Date.UTC(vy, vm - 1, 1)).getUTCDay();
  const numDays = daysInMonth(viewMonth);
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ];

  const chip = (active: boolean) =>
    `flex h-9 items-center rounded-full border px-3.5 text-sm transition-colors ${
      active
        ? "border-ink bg-ink font-medium text-cream"
        : "border-hairline bg-surface text-ink-soft hover:text-ink"
    }`;

  return (
    <div className="flex flex-col gap-1.5">
      <input type="hidden" name={name} value={value} />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={chip(value === today)} onClick={() => pick(today)}>
          Today
        </button>
        <button
          type="button"
          className={chip(value === yesterday)}
          onClick={() => pick(yesterday)}
        >
          Yesterday
        </button>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={chip(open || (value !== today && value !== yesterday))}
        >
          <svg
            aria-hidden="true"
            className="mr-1.5 h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M8 3v4M16 3v4M3 10h18" />
          </svg>
          {value === today || value === yesterday ? "Pick a date" : fullDayLabel(value)}
        </button>
      </div>

      {open && (
        <div className="mt-1 rounded-xl border border-hairline bg-cream p-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setViewMonth(addMonths(viewMonth, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-surface text-ink"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-ink">
              {monthLabel(viewMonth)}
            </span>
            {viewMonth >= currentMonth ? (
              <span
                aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline text-ink-soft/40"
              >
                ›
              </span>
            ) : (
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-surface text-ink"
              >
                ›
              </button>
            )}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5 text-center">
            {WEEKDAYS.map((w) => (
              <span key={w} className="py-1 text-xs font-medium text-ink-soft">
                {w}
              </span>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <span key={`blank-${i}`} />;
              const date = `${viewMonth}-${String(day).padStart(2, "0")}`;
              const disabled = date > today;
              const selected = date === value;
              const isToday = date === today;
              return (
                <button
                  key={date}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(date)}
                  aria-pressed={selected}
                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm tabular-nums transition-colors ${
                    selected
                      ? "bg-ink font-semibold text-cream"
                      : disabled
                        ? "text-ink-soft/30"
                        : isToday
                          ? "border border-ink text-ink"
                          : "text-ink hover:bg-hairline"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
