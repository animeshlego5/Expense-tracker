export function StatTile({
  label,
  value,
  hero = false,
}: {
  label: string;
  value: string;
  hero?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-4">
      <p className="text-sm text-ink-soft">{label}</p>
      <p
        className={
          hero
            ? "mt-1 text-5xl font-semibold tracking-tight text-ink"
            : "mt-1 text-2xl font-semibold text-ink"
        }
      >
        {value}
      </p>
    </div>
  );
}
