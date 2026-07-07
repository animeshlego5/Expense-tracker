import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { CATEGORY_KEYS } from "@/lib/categories";
import { DEFAULT_BUDGET_PAISE } from "@/lib/budget";
import { user } from "./auth";

export const expenseCategory = pgEnum("expense_category", CATEGORY_KEYS);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amountPaise: integer("amount_paise").notNull(), // > 0, enforced by zod at the boundary
    category: expenseCategory("category").notNull(),
    note: text("note"),
    occurredOn: date("occurred_on", { mode: "string" }).notNull(), // IST calendar day 'YYYY-MM-DD'
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("expenses_user_date_idx").on(t.userId, t.occurredOn)]
);

export const incomes = pgTable(
  "incomes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amountPaise: integer("amount_paise").notNull(),
    source: text("source").notNull(), // "Salary", "Freelance", ...
    occurredOn: date("occurred_on", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("incomes_user_date_idx").on(t.userId, t.occurredOn)]
);

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  monthlyBudgetPaise: integer("monthly_budget_paise")
    .notNull()
    .default(DEFAULT_BUDGET_PAISE),
  // Expected income per month; null = unset. Actual income above this renders
  // as a gain on the dashboard.
  monthlyIncomeTargetPaise: integer("monthly_income_target_paise"),
  // Student mode: hides income tracking everywhere (dashboard, navbar, settings).
  hideIncome: boolean("hide_income").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Optional monthly spending cap per category. Absence of a row = no cap.
export const categoryBudgets = pgTable(
  "category_budgets",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    category: expenseCategory("category").notNull(),
    monthlyBudgetPaise: integer("monthly_budget_paise").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.category] })]
);

// Recurring subscriptions. Each active row auto-posts one expense per month
// (see src/lib/subscriptions.ts). `lastPostedMonth` ('YYYY-MM') is the last
// month this subscription materialized an expense — used to make posting
// idempotent so a subscription never double-posts within a month.
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // "Netflix", "Wi-Fi", ...
    amountPaise: integer("amount_paise").notNull(), // > 0, enforced by zod
    category: expenseCategory("category").notNull().default("subscriptions"),
    dayOfMonth: integer("day_of_month").notNull(), // 1–31; clamped to month length
    active: boolean("active").notNull().default(true),
    lastPostedMonth: text("last_posted_month"), // 'YYYY-MM' or null (never posted)
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("subscriptions_user_idx").on(t.userId)]
);

export type Expense = typeof expenses.$inferSelect;
export type Income = typeof incomes.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type CategoryBudget = typeof categoryBudgets.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
