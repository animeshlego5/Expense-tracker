# Product Requirements — Expense Tracker

## Goal

Help an individual stay under a self-set monthly spending budget by making it fast to log daily expenses and income, and by surfacing — at a glance — whether they are on track for the month.

## Persona

**Ravi, 28, salaried, Bengaluru.** Spends on his phone throughout the day. Wants a 10-second way to jot an expense right after it happens, and one screen that tells him "am I overspending this month?" without building spreadsheets. Thinks in ₹ and in the IST calendar month. Not an accountant — does not want categories, currencies, or reports he has to configure.

## User stories

- As a new user, I can sign up with my email and a password so I have a private account.
- As a returning user, I can log in and stay logged in for weeks without re-entering my password.
- As a user, I can log an expense in seconds: amount, one of six categories, optional note, and the day it happened.
- As a user, I can log income: amount and a free-text source (e.g. "Salary", "Freelance").
- As a user, I can review, edit, and delete my past expenses and income, browsing month by month.
- As a user, I open one dashboard and immediately see what I've spent this month, my income this month, where the money went, how this month compares to recent months, and whether I'm on track against my budget.
- As a user, I can set my own monthly budget so the alerts fit my life.
- As a user, I can sign out.

## Functional requirements

### Authentication
- Email + password sign-up and log-in (Better Auth).
- Sessions persist in the database with a **60-day sliding** expiry (activity extends the session).
- All app screens require a valid session; unauthenticated visitors are redirected to log in.
- On sign-up, a `user_settings` row is created automatically with the default budget.

### Expense CRUD
- Create an expense: amount (₹, entered by the user, stored as paise), category (exactly one of the six fixed categories), optional note, and `occurred_on` (IST calendar day, defaults to today).
- List expenses for a chosen month, grouped by day, newest first.
- Edit and delete any of one's own expenses.

### Income CRUD
- Create an income entry: amount, free-text source, and `occurred_on` (defaults to today).
- List, edit, and delete one's own income entries, browsable by month.

### Dashboard
- Hero KPI: **total spent this month**.
- KPI: **income this month**.
- **Donut** pie chart: expense distribution by category for the month.
- **Bar** chart: income vs. expense across the trailing 6 months.
- **Recent expenses**: the 5 most recent.
- **Budget banner**: current budget status (see below).

### Budget alerts
- Default budget ₹20,000/month; per-user configurable.
- Run-rate projection: `projected = spend × daysInMonth / daysElapsed`, using the IST day-of-month.
- **Over** (critical): shown whenever actual spend exceeds the budget, even on day 1.
- **At-risk** (warning): shown when the projection exceeds the budget, but only from **day 3** onward.
- **Grace window** (days 1–2): a large early purchase shows the projection as a stat but does **not** raise the at-risk banner.

### Settings
- Edit the monthly budget (validated, stored as paise).
- Sign out.

## Non-functional requirements

- **Mobile-first**: designed for a phone screen first; usable one-handed; scales up on larger screens.
- **Free hosting**: deployable at zero cost (Vercel + Neon free tiers). No paid services required.
- **INR / IST**: single currency (Indian Rupee) and single timezone (Asia/Kolkata) for all users. Money is exact (integer paise); "today" and month boundaries are computed in IST regardless of server timezone.
- **Fast local setup**: runs with no external database — an embedded PGlite Postgres is auto-created for local dev.
- **Accessible palette**: fixed category colors are chosen to remain distinguishable under color-vision deficiency on the cream surface.

## Out of scope (v1)

- Multi-currency support (INR only).
- Per-user timezones (IST only).
- Shared / household / group budgets (each account is single-user).
- Email or push notifications for budget alerts (in-app banner only).
- Recurring-transaction automation, receipt scanning, bank/UPI import, data export, reporting beyond the dashboard.
- Custom or user-defined categories (the six categories are fixed).
