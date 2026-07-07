# Expense Tracker — Project Memory

Mobile-first, multi-user expense tracker. Users sign up / log in (email + password, 60-day sliding sessions) and log daily expenses in 6 fixed categories (Food, Travel, Rent, Bills, Subscriptions, Other) plus income entries. One dashboard shows spend this month (with a day-progress hint like `7/31`), income this month (green + gain bracket when above the user's income target), a red/green "On pace for" projection, a category donut (labels toggle % ↔ short codes like TRA/SUBS, white halo; overspent categories blink via per-category caps in `category_budgets`; legend links to `/expenses?category=`), recent expenses, and a 6-month income-vs-expense bar chart at the bottom, plus a budget banner. The expenses page filters by month and category chips. Budget defaults to ₹20,000/month (per-user configurable). **Recurring subscriptions** (`subscriptions` table) auto-post one expense per month on their billing day (`src/lib/subscriptions.ts`, lazy no-cron catch-up on dashboard load); pause to stop without deleting history. **Student mode** (`user_settings.hide_income`) hides income tracking everywhere. Typeface: Hanken Grotesk via `next/font`. Money is stored as integer **paise**; all dates are **IST** (Asia/Kolkata).

## Commands

| Command | What it does |
| --- | --- |
| `bun install` | Install dependencies (from `bun.lock`) |
| `bun dev` | Dev server at http://localhost:3000 |
| `bun run build` | Production build |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run db:push` | `drizzle-kit push` — sync schema to the DB |

## Stack

| Layer | Choice |
| --- | --- |
| Runtime / PM | Bun |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 (`@theme` tokens in `src/app/globals.css`) |
| ORM | Drizzle ORM |
| DB (prod) | Neon serverless Postgres, `neon-http` driver (pooled `DATABASE_URL`) |
| DB (dev) | Embedded PGlite at `./.pglite` when `DATABASE_URL` unset |
| Auth | Better Auth ^1.6 (email/password, Drizzle adapter, DB sessions) |
| Charts | Recharts 3 |
| Validation | zod 4 |

## Non-negotiable conventions

- **Money = integer paise.** Never store or compute money as floats. `₹20,000 = 2_000_000` paise. Convert at the UI boundary only, via `src/lib/currency.ts` (`formatPaise`, `formatPaiseCompact`, `rupeesToPaise`).
- **Dates = IST, always via `src/lib/dates.ts`.** Never `new Date().toISOString().slice(0,10)` — Vercel runs UTC and IST evenings land on the wrong day. Use `istToday`, `istCurrentMonth`, `istDayOfMonth`, `monthRange`, etc. Month ranges are **half-open** `[start, nextMonthStart)`.
- **Fixed category palette (never reassign).** Colors/labels/keys live in `src/lib/categories.ts` and `@theme`. Food `#2a78d6`, Travel `#1baf7a`, Rent `#eda100`, Bills `#008300`, Subscriptions `#4a3aa7`, Other `#e34948` (DB enum key stays `miscellaneous`). Status colors (warning `#fab219`, critical `#d03b3b`) are for alerts only — charts never reuse them; `positive` green `#008300` marks money-positive numbers (shared with income by convention).
- **RSC reads, server actions write.** Async server components read via Drizzle directly. Mutations are `"use server"` actions: zod-validate input → derive `userId` from the session (never trust the client) → write → `revalidatePath`.
- **Scope every query by user.** Every SELECT/UPDATE/DELETE filters `user_id = <session user>`. Every UPDATE/DELETE adds `AND user_id = ?` so one user can't touch another's rows.
- **`nextCookies()` is the LAST Better Auth plugin.** Order matters — it must run last to set cookies on responses.
- **Auth guard is layered.** `middleware.ts` does a cheap optimistic cookie check; the `(app)` layout and every action re-check with the real `auth.api.getSession`. Never rely on the cookie check alone.

## Money & date pitfalls

- Drizzle `sum()` returns a **string** (or `null`). Always coerce: `Number(row.total ?? 0)`.
- Neon HTTP driver has **no interactive transactions** — use single statements or `db.batch`, not `db.transaction(async …)`.
- Next 16: `headers()`, `cookies()`, `params`, and `searchParams` are **async** — `await` them.
- Recharts is **client-only** (`"use client"`) and needs a sized parent (e.g. `ResponsiveContainer` inside a fixed-height box).
- `occurred_on` is a Postgres `date` read as a `'YYYY-MM-DD'` string (`mode: "string"`) — it is the IST calendar day, not a timestamp.
- PGlite (dev DB) is **single-process** and can corrupt on hard kills (`RuntimeError: Aborted()` on next start) — reset with `rm -rf .pglite && bun run db:push`. On Windows, run standalone DB scripts under Node (`bunx tsx scripts/seed.ts`), never `bun` — PGlite's WASM aborts under Bun. See `docs/DEPLOYMENT.md`.

## Codebase pointers

- `src/db/index.ts` — dual-driver DB (`DATABASE_URL` → Neon, else PGlite); HMR-cached.
- `src/db/schema/app.ts` — `expenses`, `incomes`, `user_settings`, `category_budgets` (per-category caps), `subscriptions` (recurring) + `expense_category` enum.
- `src/db/schema/auth.ts` — Better Auth tables: `user`, `session`, `account`, `verification`.
- `src/db/schema/index.ts` — re-exports both schema files.
- `src/lib/currency.ts` — paise ↔ rupee formatting/parsing.
- `src/lib/categories.ts` — `CATEGORIES`, `CATEGORY_KEYS`, `categoryLabel`, `categoryColor`.
- `src/lib/dates.ts` — all IST calendar math.
- `src/lib/budget.ts` — `computeBudget` run-rate projection + `DEFAULT_BUDGET_PAISE`.
- `src/app/globals.css` — Tailwind v4 `@theme` design tokens.
- `src/app/(app)/` — dashboard, expenses, add (expense entry), subscriptions (recurring), income, settings pages (behind auth).
- `src/lib/subscriptions.ts` — `syncDueSubscriptions` (idempotent monthly auto-poster) + `billingDay`.
- `drizzle.config.ts` — `DIRECT_DATABASE_URL` → Neon DDL, else PGlite.
- `.env.example` — documents every env var.

## Budget run-rate rule (see `src/lib/budget.ts`)

Fixed costs (rent, bills, subscriptions — `isFixedCategory` in `src/lib/categories.ts`) are paid as a monthly lump, so they must NOT be scaled by the run-rate. Only **variable** spend (food, travel, other) is projected:

`projected = fixedSpend + expectedUnpostedSubs + (variableSpend × daysInMonth / daysElapsed)`

where `expectedUnpostedSubs` = active subscriptions not yet posted this month (so a bill due later still counts before it's paid). Status (uses **actual** logged spend = fixed + variable):
- **over** (critical) whenever actual spend > budget — even on day 1.
- **at-risk** (warning) when projection > budget from **day 3 onward** (grace window: days 1–2 show the projection stat but no banner, so one big early purchase doesn't false-alarm).
- **ok** otherwise.

Income never affects the budget or projection — only the income tile/gain.

## Detailed docs

- `docs/PRD.md` — product goal, persona, user stories, functional/non-functional requirements, out of scope. Open when deciding *what* to build.
- `docs/ARCHITECTURE.md` — stack rationale, directory layout, DB schema, auth flow, dual-driver DB, data flow, pitfalls. Open when deciding *how* things fit together.
- `docs/FEATURES.md` — per-feature behavior spec incl. dashboard composition and budget banner copy. Open when implementing a screen.
- `docs/BUILD_PHASES.md` — 6 phases with checklists + verification, and the parallel-wave mapping. Open to see what's done and what's next.
- `docs/DEPLOYMENT.md` — Neon + Vercel free deploy, env vars, local dev. Open when shipping or setting up an environment.
