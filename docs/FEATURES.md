# Features — Behavior Spec

Money is formatted with `formatPaise` (₹, `en-IN`, no decimals when whole). Categories always use their fixed color/label from `src/lib/categories.ts`. Status colors (warning `#fab219`, critical `#d03b3b`) appear only in the budget banner.

## Authentication

- **Sign up**: name, email, password → creates the user, seeds `user_settings` with `DEFAULT_BUDGET_PAISE`, starts a session, lands on `/dashboard`.
- **Log in**: email + password → session, redirect to `/dashboard`. Invalid credentials show an inline error.
- **Session**: 60-day sliding; the user stays logged in across visits. Visiting `/` while authenticated redirects to `/dashboard`; while unauthenticated, to `/login`.
- **Guards**: middleware optimistically bounces unauthenticated requests off `(app)` routes; the `(app)` layout enforces the real session.

## Dashboard (`/dashboard`)

Single scrollable, mobile-first column (widens on `lg`). Reads the current IST month. Composition, top to bottom:

1. **Budget banner** — only rendered in the `at-risk` or `over` states (see Budget alerts). Warning styling for at-risk, critical for over.
2. **KPI row**
   - **Hero: "Spent this month"** — total expense for the current IST month, large, with a **day-progress hint** next to the label: `daysElapsed/daysInMonth` (e.g. `7/31`).
   - **"Income this month"** — total income for the current IST month. Hidden entirely in student mode. If an **income target** is set and actual income exceeds it, the number renders **green** with a trailing bracket showing the gain, e.g. `₹45,000 (+₹5,000)`.
   - **"On pace for"** — the projected month-end spend, always shown: **red with an up-arrow icon** when the projection exceeds the budget, **green** when on track.
3. **Category donut** — expense distribution by category for the month.
   - Center of the donut shows the **total spent** for the month.
   - Header has an **icon-only toggle button** switching slice labels between **percentages** (default) and **category names**.
   - Slice labels appear only on slices that are **≥ 8%** of the total (smaller slices stay unlabeled to avoid clutter).
   - Legend: one row per category present, each with the category color swatch, label, **₹ amount and its %** of the month's spend.
   - Slice/legend colors are the fixed category palette, never reassigned. "Other" is the display label for the `miscellaneous` enum key.
   - Empty month → a friendly empty state instead of an empty chart.
4. **Recent expenses** — the 5 most recent expenses (by `occurred_on`, then recency), each showing category color/label, note, day, and amount. Links through to the expenses page.
5. **6-month income vs. expense bar chart** (bottom of page) — the trailing 6 IST months (`trailingMonths(6)`), oldest → newest, each month a grouped/paired income and expense bar. X-axis uses `monthShortLabel` ("Jul"); Y-axis ticks use `formatPaiseCompact` ("₹20K"). In student mode the income series is omitted.

## Expenses (`/expenses`)

- **List** for a month, grouped by day (newest day first, newest entry first within a day). Day headers use `dayLabel` ("Mon, 6 Jul"); each group can show a per-day subtotal.
- **Month navigation** via `?month=YYYY-MM` (defaults to the current IST month). Prev/next controls step with `addMonths`; the heading uses `monthLabel` ("July 2026").
- **Add** — amount (₹ input parsed by `rupeesToPaise`), category (one of six), optional note, date (`occurred_on`, defaults to `istToday()`). Server action zod-validates (amount > 0, category in enum), scopes to the session user, inserts, `revalidatePath`.
- **Edit** — same form pre-filled; updates scoped `AND user_id = ?`.
- **Delete** — removes the entry, scoped `AND user_id = ?`, with confirmation.

## Income (`/income`)

Same structure as expenses, but each entry has a free-text **source** (e.g. "Salary", "Freelance") instead of a category. Add / edit / delete and `?month=` navigation behave identically. In student mode this page redirects to `/dashboard`.

## Settings (`/settings`)

- **Edit monthly budget** — rupee input parsed to paise via `rupeesToPaise`, validated (> 0), upserted into `user_settings` scoped to the session user, then `revalidatePath('/dashboard')` so the banner reflects the new budget immediately.
- **Student mode toggle** — for users on variable pocket money: sets `user_settings.hide_income`. When ON, income disappears everywhere: the dashboard income tile, the income series in the 6-month chart, the Income tab in the navbar, the `/income` page (redirects), and the income-target form below. Only budget tracking remains.
- **Expected monthly income** (hidden in student mode) — sets `user_settings.monthly_income_target_paise`; empty input clears it. Actual income above this shows as a green gain on the dashboard.
- **Sign out** — ends the session and redirects to `/login`.

## Budget alerts

Computed by `computeBudget` in `src/lib/budget.ts` from `{ spendPaise, budgetPaise, daysElapsed = istDayOfMonth(), daysInMonth }`.

- **Projection**: `projected = round(spend × daysInMonth / daysElapsed)`.
- **`over` (critical)** — whenever `spend > budget`, even on day 1.
- **`at-risk` (warning)** — when `spend > 0` and `projected > budget` and `daysElapsed ≥ 3`.
- **`ok`** — otherwise (no banner).
- **Grace window (days 1–2)**: a projection over budget does **not** raise the banner; the projected figure still appears as a dashboard stat.

### Banner copy

- **over** (critical): `You've spent ₹X — ₹Y over your ₹20,000 budget.`
  where `X = formatPaise(spend)`, `Y = formatPaise(overspendPaise)` (`overspend = spend − budget`), and `₹20,000` is the user's actual budget via `formatPaise(budget)`.
- **at-risk** (warning): `At this pace you'll spend ₹X by month end (₹Y over budget).`
  where `X = formatPaise(projected)` and `Y = formatPaise(overspendPaise)` (`overspend = projected − budget`).
