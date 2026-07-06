# Build Phases

Six logical phases with a verification gate each. **Execution is parallel-wave based**, not strictly sequential — see the mapping at the bottom.

## Phase 1 — Scaffold + theme ✅ (done)

- [x] Bun + Next.js 16 App Router + TypeScript project
- [x] Tailwind v4 with `@theme` tokens in `src/app/globals.css` (cream surface, category palette, status colors)
- [x] Root layout (`html`/`body`, metadata, viewport `themeColor`)
- [x] `(app)` route group with placeholder dashboard / expenses / income / settings pages
- [x] Shared libs: `currency.ts`, `categories.ts`, `dates.ts`, `budget.ts`
- [x] DB schema (auth + app tables), dual-driver `src/db/index.ts`, `drizzle.config.ts`
- [x] `.env.example`, `next.config.ts` (`serverExternalPackages`)
- **Verify**: `bun run typecheck` passes; `bun dev` serves the placeholder pages on the cream theme.

## Phase 2 — DB + Auth ✅ (done)

- [x] Better Auth config: email/password, Drizzle adapter, DB sessions, 60-day sliding expiry
- [x] `nextCookies()` registered **last** in the plugin list
- [x] `databaseHooks` on user-create seeds a `user_settings` row with `DEFAULT_BUDGET_PAISE`
- [x] Auth route handler + `auth.api` server helpers; `requireUser()` helper
- [x] `middleware.ts` optimistic cookie check for `(app)` routes
- [x] Real session guard in `(app)/layout.tsx`
- [x] Login / sign-up pages and forms; `/` redirects by session
- [x] `bun run db:push` creates all tables in PGlite
- **Verify** ✅: signup created `user` + seeded `user_settings` (₹20,000 default); unauthenticated `/dashboard` → 307 to `/login`; authenticated dashboard 200.

## Phase 3 — Expense & Income CRUD ✅ (done)

- [x] Expense create/edit/delete server actions (zod-validated, userId-scoped, `revalidatePath`)
- [x] Income create/edit/delete server actions (same rules, `source` field)
- [x] Expenses list page: grouped-by-day, `?month=` navigation, add/edit/delete UI
- [x] Income list page: same structure with source
- [x] Amount entry via `rupeesToPaise` (capped at ₹1 crore to fit int4 paise); dates default to `istToday()`
- **Verify** ✅: seeded 9 expenses + 1 income render grouped by day under July 2026; a second account sees zero data bleed.

## Phase 4 — Dashboard + charts ✅ (done)

- [x] Server-side month aggregation: spend this month, income this month, per-category totals, trailing-6-month totals, recent 5
- [x] KPI row (hero "Spent this month" + "Income this month")
- [x] Category donut (center total, ≥8% slice labels, legend rows with ₹ + %)
- [x] 6-month income-vs-expense bar chart (`trailingMonths(6)`, compact ticks)
- [x] Recent-expenses list
- [x] Empty states for a month with no data
- **Verify** ✅: seeded ₹4,929 spend / ₹45,000 income render exactly; empty-state dashboard confirmed on a fresh account.

## Phase 5 — Budget alerts ✅ (done)

- [x] Wire `computeBudget` into the dashboard using `istDayOfMonth()` + `daysInMonth()`
- [x] Budget banner: `over` (critical) and `at-risk` (warning) states with exact copy
- [x] Grace window: no banner days 1–2; projection still shown as a stat
- [x] Settings: edit monthly budget (upsert `user_settings`, revalidate dashboard)
- **Verify** ✅ (at-risk path end-to-end): ₹4,929 by day 7 of 31 → "At this pace you'll spend ₹21,828.43 by month end (₹1,828.43 over budget)." The `over`/grace branches are pure-function paths in `computeBudget` (same component, different copy).

## Phase 6 — Polish + deploy (partially done — deploy pending)

- [x] App-shell navigation (bottom tabs mobile / top bar desktop), loading/empty states
- [ ] Error boundaries (`error.tsx`) and a deeper accessibility pass
- [ ] Neon project + env vars; `bun run db:push` against the direct URL
- [ ] GitHub → Vercel import; production smoke test
- **Verify**: `bun run build` + `bun run typecheck` clean; deployed app signs up, logs an expense, and shows the correct banner in production (see `docs/DEPLOYMENT.md`).

## Parallel-wave mapping

The phases above are the logical dependency order. Actual build runs in waves of parallel agents:

- **Wave 1** — Auth foundation (Phase 2) **and** Docs, in parallel isolated worktrees.
- **Wave 2** — Dashboard + charts (Phase 4) **and** Expense/Income CRUD (Phase 3), in parallel, both building on the Phase 2 auth/session and the shared libs.

Phases 5 (budget alerts) and 6 (polish + deploy) fold into and follow wave 2. The shared libs (`currency`, `categories`, `dates`, `budget`) and the DB schema are the stable contract that lets these waves proceed without stepping on each other.
