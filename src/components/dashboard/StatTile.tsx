const toneClass = {
  positive: "text-positive",
  critical: "text-critical",
} as const;

export function StatTile({
  label,
  value,
  hero = false,
  hint,
  tone,
  trendUp = false,
  extra,
}: {
  label: string;
  value: string;
  hero?: boolean;
  /** Small muted annotation next to the label, e.g. "7/31". */
  hint?: string;
  /** Colors the value: green (positive) or red (critical). Default ink. */
  tone?: keyof typeof toneClass;
  /** Renders an upward arrow before the value (used when overshooting budget). */
  trendUp?: boolean;
  /** Small trailing annotation in the tone color, e.g. "(+₹5,000)". */
  extra?: string;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-4">
      <p className="flex items-baseline justify-between text-sm text-ink-soft">
        <span>{label}</span>
        {hint && <span className="tabular-nums text-xs">{hint}</span>}
      </p>
      <p
        className={`mt-1 font-semibold ${
          hero ? "text-5xl tracking-tight" : "text-2xl"
        } ${tone ? toneClass[tone] : "text-ink"}`}
      >
        {trendUp && (
          <svg
            aria-label="trending up"
            className="mr-1 inline-block h-[0.7em] w-[0.7em] align-baseline"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        )}
        {value}
        {extra && (
          <span className="ml-1.5 align-baseline text-sm font-medium">
            {extra}
          </span>
        )}
      </p>
    </div>
  );
}
