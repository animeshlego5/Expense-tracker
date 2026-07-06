# Expense Tracker

A mobile-first, multi-user web application for tracking personal expenses and income, built around one goal: knowing whether you are on pace to stay under your monthly budget before the month ends, not after.

Every expense is logged against one of six fixed categories — Food, Travel, Rent, Bills, Subscriptions, and Other — with an amount, an optional note, and the calendar day it happened. Income entries carry an amount and a free-text source. Everything else in the application is derived from these two streams. Currency is Indian Rupees; all calendar logic is anchored to Indian Standard Time.

## The dashboard

A single scrollable page summarises the current month:

- **Spent this month** — the headline figure, annotated with how far into the month you are (for example, day 7 of 31).
- **Income this month** — total income, rendered in green with the surplus in brackets when it exceeds the user's expected monthly income.
- **On pace for** — a run-rate projection of month-end spend, red with an upward arrow when the pace overshoots the budget, green when on track.
- **Category donut** — how the month's spending distributes across categories, with the month total in the centre. A toggle switches slice labels between percentages and short category codes. Each legend row links to that category's filtered expense list.
- **Recent expenses** — the five most recent entries.
- **Six-month tracker** — a bar chart comparing income and expenses across the trailing six months.

## Budget awareness

The projection is a simple run rate: spend so far, scaled by days in the month over days elapsed. When the projection crosses the monthly budget (default ₹20,000, configurable per user), a warning banner states the projected total and the overage in plain words. When actual spend has already crossed the budget, the banner becomes critical. The first two days of a month are treated as a grace window so that a single early purchase does not raise a false alarm — the projection is still shown as a statistic, but no banner appears.

Beyond the overall budget, each category can carry its own optional monthly cap. A category that exceeds its cap is flagged where the eye already is: its donut slice gets a red border, its legend row shows the overage, and its tooltip explains it. This answers not just "am I overspending?" but "where?".

## Recording and reviewing

Entry and review are deliberately separated. A dedicated Add page, one tap away in the navigation bar, holds the expense form: a rupee amount field, a six-chip category selector, an optional note, and a themed inline calendar with Today and Yesterday shortcuts (future dates are disabled). The Expenses page is purely for reading: entries grouped by day with day subtotals, month-by-month navigation, a category filter chip row, and inline editing and deletion. Income has its own equivalent page.

## Accounts and modes

Each user has an isolated account with email and password authentication and sessions that persist for sixty days on a sliding window, so an active user never logs in twice. Every query and mutation is scoped to the session's user on the server.

A student mode acknowledges that not everyone has a salary: toggling it hides income tracking everywhere — the dashboard tile, the chart series, the navigation tab, and the income settings — leaving a budget-only tracker suited to living on pocket money.

## Design

The interface uses a cream surface system with dark ink text, hairline borders, and the Hanken Grotesk typeface. Categories keep fixed colours chosen to remain distinguishable under colour-vision deficiency, and those colours are never reassigned or reused for status. Alert colours (amber, red) are reserved for the budget banner and overspend markers, and money-positive figures share the income green. Chart labels are drawn in ink with a white halo so they stay readable on any slice colour. On phones the app presents a bottom tab bar with comfortable touch targets; on larger screens, a top navigation bar.

## Technical foundation

| Concern | Choice |
| --- | --- |
| Runtime and package manager | Bun |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 with design tokens |
| Database | Postgres via Drizzle ORM — Neon serverless in production, embedded PGlite in development |
| Authentication | Better Auth with database-backed sessions |
| Charts | Recharts |
| Validation | Zod at every server-action boundary |

Two decisions do the most work for correctness. Money is stored exclusively as integer paise, so sums are exact and no floating-point drift can appear in a total. And every date computation goes through a single IST-anchored module, so an expense logged late in the evening lands on the correct calendar day regardless of the server's timezone, and month boundaries fall exactly at midnight IST.

Reads are performed by async server components querying the database directly; writes go through validated server actions that derive the user from the session, never from the client. Aggregations (month totals, category grouping, the six-month series) happen in SQL with half-open date ranges.

## Documentation

- [`docs/PRD.md`](./docs/PRD.md) — product requirements and scope.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — schema, auth flow, data flow, and known pitfalls.
- [`docs/FEATURES.md`](./docs/FEATURES.md) — per-feature behaviour specification.
- [`docs/BUILD_PHASES.md`](./docs/BUILD_PHASES.md) — build plan and verification status.
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — environment configuration.
- [`CLAUDE.md`](./CLAUDE.md) — conventions and codebase map for AI-assisted sessions.
