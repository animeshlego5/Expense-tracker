# Architecture

## Stack rationale

- **Bun** — one tool for install (`bun.lock`) and dev runtime; fast, and Vercel detects the lockfile to run `bun install`.
- **Next.js 16 App Router + React 19** — server components read data directly (no API layer), server actions handle writes. One deploy target, SSR by default, mobile-friendly.
- **TypeScript (strict)** — types flow from the Drizzle schema through the libs to the UI.
- **Tailwind CSS v4** — design tokens declared once as `@theme` variables in `src/app/globals.css`; utilities like `bg-cream`, `text-ink`, `text-cat-food` are generated from them. No `tailwind.config.js`.
- **Drizzle ORM** — typed SQL, one schema definition drives both drivers and `drizzle-kit`.
- **Neon serverless Postgres** in prod (HTTP driver, works in serverless functions); **PGlite** embedded Postgres in dev so the app runs with zero setup.
- **Better Auth ^1.6** — email/password with a Drizzle adapter and DB-backed sessions; integrates cleanly with the App Router via `nextCookies()`.
- **Recharts 3** — the donut and bar charts; client components.
- **zod 4** — validates every server-action input at the trust boundary.

## Directory layout

```
src/
  app/
    globals.css            # Tailwind v4 @theme design tokens
    layout.tsx             # Root layout (html/body, metadata, viewport)
    page.tsx               # "/" → redirect to /login (or /dashboard when authed)
    (app)/                 # Authenticated area (route group)
      layout.tsx           # Real session guard + app shell/nav
      dashboard/page.tsx
      expenses/page.tsx
      income/page.tsx
      settings/page.tsx
  db/
    index.ts               # Dual-driver Drizzle client (Neon | PGlite)
    schema/
      auth.ts              # user, session, account, verification
      app.ts               # expenses, incomes, user_settings, expense_category enum
      index.ts             # re-exports auth + app
  lib/
    currency.ts            # paise <-> rupee format/parse
    categories.ts          # fixed category keys/labels/colors
    dates.ts               # IST calendar math
    budget.ts              # run-rate projection (pure)
drizzle.config.ts          # drizzle-kit config (direct URL | pglite)
next.config.ts             # serverExternalPackages for pglite + neon
.env.example               # documents env vars
```

Path alias: `@/*` → `./src/*` (see `tsconfig.json`).

## Database schema

All tables are Postgres. Money columns are `integer` paise. `occurred_on` is a `date` read as a `'YYYY-MM-DD'` string (Drizzle `mode: "string"`), representing the IST calendar day.

### Better Auth tables (`src/db/schema/auth.ts`)
- **user** — `id` (text pk), `name`, `email` (unique), `email_verified` (bool), `image`, `created_at`, `updated_at`.
- **session** — `id` (text pk), `expires_at`, `token` (unique), `created_at`, `updated_at`, `ip_address`, `user_agent`, `user_id` → user (cascade).
- **account** — credential/provider storage incl. hashed `password`; `id`, `account_id`, `provider_id`, `user_id` → user (cascade), token fields, `created_at`, `updated_at`.
- **verification** — `id`, `identifier`, `value`, `expires_at`, timestamps.

### App tables (`src/db/schema/app.ts`)
- **expense_category** — pgEnum built from `CATEGORY_KEYS`: `food`, `travel`, `rent`, `bills`, `subscriptions`, `miscellaneous`.
- **expenses** — `id` (uuid pk, default random), `user_id` → user (cascade), `amount_paise` (int, > 0 enforced by zod), `category` (enum), `note` (text, nullable), `occurred_on` (date string, IST day), `created_at` (timestamptz, defaults now). Index **`expenses_user_date_idx`** on `(user_id, occurred_on)`.
- **incomes** — same shape as expenses but with `source` (text, not null) instead of `category`. Index **`incomes_user_date_idx`** on `(user_id, occurred_on)`.
- **user_settings** — `user_id` (text pk → user, cascade), `monthly_budget_paise` (int, default `DEFAULT_BUDGET_PAISE` = 2,000,000 = ₹20,000), `updated_at` (timestamptz). One row per user, seeded on user creation via a Better Auth `databaseHooks` on-create hook.

The `(user_id, occurred_on)` indexes back the dominant query pattern: "this user's rows within a month range."

## Auth flow (three layers)

1. **Middleware — optimistic cookie check.** `middleware.ts` cheaply inspects the session cookie and redirects obviously-unauthenticated requests away from the `(app)` area. It does **not** validate the session against the DB (Edge, must stay cheap) — it is a fast gate, not the source of truth.
2. **Layout — real guard.** The `(app)/layout.tsx` server component calls `auth.api.getSession({ headers: await headers() })`. No session → redirect to log in. This is the authoritative page-level guard.
3. **Action — `requireUser`.** Every `"use server"` action independently re-resolves the session and derives `userId` from it. The client never supplies a user id. Actions that mutate scope every UPDATE/DELETE with `AND user_id = ?`.

`nextCookies()` must be the **last** Better Auth plugin so it can write session cookies onto action/route responses. Sessions are 60-day sliding: activity refreshes the expiry.

## Dual-driver database strategy

`src/db/index.ts` picks a driver at import time:
- `DATABASE_URL` set → **Neon** via `drizzle-orm/neon-http` over `@neondatabase/serverless`. Use the **pooled** connection string (host contains `-pooler`).
- `DATABASE_URL` unset → **PGlite** (`@electric-sql/pglite`) persisted at `./.pglite`, wrapped by `drizzle-orm/pglite`. The PGlite instance is cached on `globalThis` so HMR reloads in dev don't reopen the file.

Both expose the same `Db` type (`PgDatabase<…, typeof schema>`), so app code is driver-agnostic. `next.config.ts` lists both packages in `serverExternalPackages` so they aren't bundled.

**Migrations / DDL** are handled separately by `drizzle-kit` (`bun run db:push`), driven by `drizzle.config.ts`: if `DIRECT_DATABASE_URL` (the **non-pooled** Neon string) is set it targets Neon, otherwise it targets the local PGlite file. DDL never runs pooled and never runs in the Vercel build.

## Data flow

- **Reads** happen in async server components: import `db` + schema, query with Drizzle (scoped by `userId` and a half-open month range), render. No client fetching, no API routes for reads.
- **Writes** happen in `"use server"` actions: (1) zod-validate the form input, (2) resolve `userId` from the session, (3) execute the INSERT/UPDATE/DELETE (mutations scoped `AND user_id = ?`), (4) `revalidatePath` the affected routes so RSCs re-render with fresh data.

## IST date handling

All "today" and month math lives in `src/lib/dates.ts`, which formats through `Intl.DateTimeFormat` with `timeZone: "Asia/Kolkata"`. **Never** use `new Date().toISOString().slice(0,10)` — Vercel functions run in UTC, so an IST evening (after 18:30 IST) would resolve to the next UTC day and land expenses on the wrong date. Month windows are **half-open** `[monthStart, nextMonthStart)` via `monthRange`, which composes safely with SQL `>= start AND < end` and avoids month-length edge cases. Key exports: `istToday`, `istCurrentMonth`, `istDayOfMonth`, `daysInMonth`, `monthRange`, `addMonths`, `trailingMonths`, `monthLabel`, `monthShortLabel`, `dayLabel`.

## Key pitfalls

- **Drizzle `sum()` returns a string** (or `null`), because SQL `numeric` doesn't map to JS `number`. Always coerce: `Number(row.total ?? 0)`. Same care for `count()`.
- **Neon HTTP driver has no interactive transactions.** `db.transaction(async (tx) => …)` isn't supported over `neon-http`. Use single statements or `db.batch([...])`. Keep multi-statement invariants minimal.
- **Next 16 async request APIs.** `headers()`, `cookies()`, and a page's `params` / `searchParams` are Promises — `await` them (e.g. `const { month } = await searchParams`).
- **Recharts is client-only.** Chart components need `"use client"` and must render inside a parent with an explicit size (typically `ResponsiveContainer` within a fixed-height container) or they collapse to zero height. Keep data-shaping on the server and pass plain arrays as props.
- **`occurred_on` is a date string, not a Date.** Compare and range it as `'YYYY-MM-DD'` strings produced by `src/lib/dates.ts`; don't `new Date()` it for calendar logic.
