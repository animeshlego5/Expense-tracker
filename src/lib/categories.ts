export const CATEGORIES = [
  // `fixed`: paid in a lump once a month (rent, bills, subscriptions), so it
  // must NOT be scaled by the daily run-rate in the budget projection.
  // Non-fixed categories fluctuate day to day and ARE run-rate projected.
  { key: "food", label: "Food", short: "FOOD", color: "#2a78d6", fixed: false },
  { key: "travel", label: "Travel", short: "TRA", color: "#1baf7a", fixed: false },
  { key: "rent", label: "Rent", short: "RENT", color: "#eda100", fixed: true },
  { key: "bills", label: "Bills", short: "BILLS", color: "#008300", fixed: true },
  { key: "subscriptions", label: "Subscriptions", short: "SUBS", color: "#4a3aa7", fixed: true },
  // DB enum key stays "miscellaneous"; display name is "Other".
  { key: "miscellaneous", label: "Other", short: "OTHER", color: "#e34948", fixed: false },
] as const;

export type ExpenseCategory = (typeof CATEGORIES)[number]["key"];

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key) as [
  ExpenseCategory,
  ...ExpenseCategory[],
];

const FIXED_KEYS = new Set<ExpenseCategory>(
  CATEGORIES.filter((c) => c.fixed).map((c) => c.key)
);

/** True for categories paid as a monthly lump (rent, bills, subscriptions). */
export function isFixedCategory(key: ExpenseCategory): boolean {
  return FIXED_KEYS.has(key);
}

export function categoryLabel(key: ExpenseCategory): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export function categoryColor(key: ExpenseCategory): string {
  return CATEGORIES.find((c) => c.key === key)?.color ?? "#52514E";
}
