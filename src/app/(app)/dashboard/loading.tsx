export default function Loading() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-2xl border border-hairline bg-surface"
        />
      ))}
    </div>
  );
}
