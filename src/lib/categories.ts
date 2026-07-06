export const CATEGORIES = [
  { key: "food", label: "Food", short: "FOOD", color: "#2a78d6" },
  { key: "travel", label: "Travel", short: "TRA", color: "#1baf7a" },
  { key: "rent", label: "Rent", short: "RENT", color: "#eda100" },
  { key: "bills", label: "Bills", short: "BILLS", color: "#008300" },
  { key: "subscriptions", label: "Subscriptions", short: "SUBS", color: "#4a3aa7" },
  // DB enum key stays "miscellaneous"; display name is "Other".
  { key: "miscellaneous", label: "Other", short: "OTHER", color: "#e34948" },
] as const;

export type ExpenseCategory = (typeof CATEGORIES)[number]["key"];

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key) as [
  ExpenseCategory,
  ...ExpenseCategory[],
];

export function categoryLabel(key: ExpenseCategory): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export function categoryColor(key: ExpenseCategory): string {
  return CATEGORIES.find((c) => c.key === key)?.color ?? "#52514E";
}
