# Expense Tracker

A mobile-first, multi-user expense tracker. Log daily expenses across six fixed categories (Food, Travel, Rent, Bills, Subscriptions, Miscellaneous) and income entries, and see one dashboard — spend this month, income this month, a category donut, a 6-month income-vs-expense chart, recent expenses, and a budget banner — that tells you whether you're on track to stay under your monthly budget (default ₹20,000). Currency is INR; all dates are IST.

Built with Bun, Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Drizzle ORM (Neon Postgres in prod, embedded PGlite in dev), Better Auth, and Recharts.

## Quickstart

No database setup required for local dev — an embedded PGlite Postgres is created automatically.

```sh
bun install
cp .env.example .env.local   # set BETTER_AUTH_SECRET (openssl rand -base64 32)
bun run db:push              # create tables in ./.pglite
bun dev                      # http://localhost:3000
```

## Commands

- `bun dev` — dev server (http://localhost:3000)
- `bun run build` — production build
- `bun run typecheck` — `tsc --noEmit`
- `bun run db:push` — sync the Drizzle schema to the database

## Documentation

- [`CLAUDE.md`](./CLAUDE.md) — project-memory hub: conventions, commands, codebase map.
- [`docs/PRD.md`](./docs/PRD.md) — product requirements.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — stack, schema, auth flow, data flow, pitfalls.
- [`docs/FEATURES.md`](./docs/FEATURES.md) — per-feature behavior spec.
- [`docs/BUILD_PHASES.md`](./docs/BUILD_PHASES.md) — build plan and status.
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — free deploy on Neon + Vercel, and local dev.
