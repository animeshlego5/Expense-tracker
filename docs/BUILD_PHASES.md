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

## Phase 2 — DB + Auth (in progress)

- [ ] Better Auth config: email/password, Drizzle adapter, DB sessions, 60-day sliding expiry
- [ ] `nextCookies()` registered **last** in the plugin list
- [ ] `databaseHooks` on user-create seeds a `user_settings` row with `DEFAULT_BUDGET_PAISE`
- [ ] Auth route handler + `auth.api` server helpers; `requireUser()` helper
- [ ] `middleware.ts` optimistic cookie check for `(app)` routes
- [ ] Real session guard in `(app)/layout.tsx`
- [ ] Login / sign-up pages and forms; `/` redirects by session
- [ ] `bun run db:push` creates all tables in PGlite
- **Verify**: sign up → row in `user` + seeded `user_settings`; log out/in; session survives a restart; unauthenticated `/dashboard` redirects to login.

## Phase 3 — Expense & Income CRUD

- [ ] Expense create/edit/delete server actions (zod-validated, userId-scoped, `revalidatePath`)
- [ ] Income create/edit/delete server actions (same rules, `source` field)
- [ ] Expenses list page: grouped-by-day, `?month=` navigation, add/edit/delete UI
- [ ] Income list page: same structure with source
- [ ] Amount entry via `rupeesToPaise`; dates default to `istToday()`
- **Verify**: add/edit/delete an expense and an income; values persist as paise; another user cannot read or mutate them; month navigation shows the right rows.

## Phase 4 — Dashboard + charts

- [ ] Server-side month aggregation: spend this month, income this month, per-category totals, trailing-6-month totals, recent 5
- [ ] KPI row (hero "Spent this month" + "Income this month")
- [ ] Category donut (center total, ≥8% slice labels, legend rows with ₹ + %)
- [ ] 6-month income-vs-expense bar chart (`trailingMonths(6)`, compact ticks)
- [ ] Recent-expenses list
- [ ] Empty states for a month with no data
- **Verify**: totals match seeded data; donut/bars use fixed category colors; charts render on mobile widths; `Number(sum ?? 0)` coercion confirmed (no string concatenation bugs).

## Phase 5 — Budget alerts

- [ ] Wire `computeBudget` into the dashboard using `istDayOfMonth()` + `daysInMonth()`
- [ ] Budget banner: `over` (critical) and `at-risk` (warning) states with exact copy
- [ ] Grace window: no banner days 1–2; projection still shown as a stat
- [ ] Settings: edit monthly budget (upsert `user_settings`, revalidate dashboard)
- **Verify**: spend > budget → critical banner (even day 1); projection > budget on day ≥ 3 → warning; day 1–2 big purchase → stat but no banner; changing the budget updates the banner.

## Phase 6 — Polish + deploy

- [ ] App-shell navigation, loading/empty/error states, mobile spacing pass
- [ ] Accessibility: labels, focus states, contrast on the cream surface
- [ ] Neon project + env vars; `bun run db:push` against the direct URL
- [ ] GitHub → Vercel import; production smoke test
- **Verify**: `bun run build` + `bun run typecheck` clean; deployed app signs up, logs an expense, and shows the correct banner in production (see `docs/DEPLOYMENT.md`).

## Parallel-wave mapping

The phases above are the logical dependency order. Actual build runs in waves of parallel agents:

- **Wave 1** — Auth foundation (Phase 2) **and** Docs, in parallel isolated worktrees.
- **Wave 2** — Dashboard + charts (Phase 4) **and** Expense/Income CRUD (Phase 3), in parallel, both building on the Phase 2 auth/session and the shared libs.

Phases 5 (budget alerts) and 6 (polish + deploy) fold into and follow wave 2. The shared libs (`currency`, `categories`, `dates`, `budget`) and the DB schema are the stable contract that lets these waves proceed without stepping on each other.
