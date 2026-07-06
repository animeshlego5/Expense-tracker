# Deployment

Free-tier deploy: **Neon** (Postgres) + **Vercel** (Next.js). Total cost ₹0.

## 1. Neon database

1. Create a Neon account and a new **project**. Pick the region closest to your users — **`ap-southeast-1` (Singapore)** for the lowest latency to Indian (IST) users.
2. From the project's connection details, copy **two** connection strings:
   - **Pooled** (host contains `-pooler`) → this is `DATABASE_URL`. The app's `neon-http` driver uses it at runtime.
   - **Direct / non-pooled** → this is `DIRECT_DATABASE_URL`. Only `drizzle-kit` uses it, for DDL.
3. Both are `postgresql://…?sslmode=require` strings; keep them secret.

## 2. Push the schema (locally, once per schema change)

Run DDL from your machine against the **direct** URL — never during the Vercel build:

```sh
DIRECT_DATABASE_URL="<neon direct string>" bun run db:push
```

`drizzle-kit push` reads `drizzle.config.ts`; with `DIRECT_DATABASE_URL` set it targets Neon and creates the `user`, `session`, `account`, `verification`, `expenses`, `incomes`, and `user_settings` tables (plus the `expense_category` enum and indexes). Re-run this whenever the schema changes. **Do not** put DDL in the Vercel build step.

## 3. GitHub → Vercel

1. Push the repo to GitHub.
2. In Vercel, **Import** the GitHub repo. Vercel detects Next.js automatically.
3. Because `bun.lock` is committed, Vercel uses **`bun install`**. Functions run on the **Node.js runtime** (do not force the Edge runtime — the Neon/PGlite packages and `serverExternalPackages` expect Node).
4. Leave the build command as the default (`next build`); the output is the default `.next`.

## 4. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Value | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Neon **pooled** string | Runtime DB connection. |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` | Random 32-byte secret; keep stable across deploys. |
| `BETTER_AUTH_URL` | `https://<app>.vercel.app` | The app's public URL. Update if you attach a custom domain. |

Do **not** set `DIRECT_DATABASE_URL` in Vercel — DDL runs only from your machine (step 2). Set the three variables for the **Production** (and Preview, if used) environments, then redeploy.

## 5. Post-deploy smoke test

1. Open `https://<app>.vercel.app` → redirected to log in.
2. Sign up → lands on `/dashboard`; confirm a `user` row and a seeded `user_settings` row exist in Neon.
3. Add an expense and an income → they appear, grouped by day.
4. Add spend above the budget → the **critical** banner shows the correct copy.
5. Reload after a few minutes → still logged in (60-day session).

## Neon autosuspend / cold starts

Neon free-tier compute **autosuspends after ~5 minutes** of inactivity. The first request after a suspend pays a **~500 ms** cold-start while compute resumes; subsequent requests are fast. This is expected on the free tier — no action needed. (For a warm demo, hit the app shortly before showing it.)

## Local development

No external services required.

- Copy `.env.example` → `.env.local`. The only thing you must set for auth to work is `BETTER_AUTH_SECRET` (`openssl rand -base64 32`). `BETTER_AUTH_URL` defaults to `http://localhost:3000`.
- **Leave `DATABASE_URL` and `DIRECT_DATABASE_URL` unset.** With no `DATABASE_URL`, the app uses the embedded **PGlite** Postgres at `./.pglite` (gitignored, auto-created on first run).
- First-time setup:

  ```sh
  bun install
  bun run db:push   # creates tables in ./.pglite
  bun dev           # http://localhost:3000
  ```

- `.env.example` documents every variable and when it's needed. To test against a real Neon DB locally, set `DATABASE_URL` (pooled) and `DIRECT_DATABASE_URL` (direct) in `.env.local` and re-run `bun run db:push`.
