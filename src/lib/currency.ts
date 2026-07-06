// All money in the app is stored as integer paise for exact arithmetic.

export function formatPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

// Compact axis-tick style, e.g. ₹20K.
export function formatPaiseCompact(paise: number): string {
  const rupees = paise / 100;
  return (
    "₹" +
    new Intl.NumberFormat("en-IN", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(rupees)
  );
}

// Parse a user-entered rupee amount ("2,500.50", "₹2500") into integer paise.
// Returns null when the input is not a valid positive-or-zero number.
export function rupeesToPaise(value: string | number): number | null {
  const n =
    typeof value === "string" ? Number(value.replace(/[₹,\s]/g, "")) : value;
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}
