export const CATEGORIES = [
  { key: "food", label: "Food", color: "#2a78d6" },
  { key: "travel", label: "Travel", color: "#1baf7a" },
  { key: "rent", label: "Rent", color: "#eda100" },
  { key: "bills", label: "Bills", color: "#008300" },
  { key: "subscriptions", label: "Subscriptions", color: "#4a3aa7" },
  { key: "miscellaneous", label: "Miscellaneous", color: "#e34948" },
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
