import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

// DATABASE_URL set → Neon serverless Postgres (pooled string, HTTP driver).
// Unset (local dev) → embedded PGlite Postgres persisted at ./.pglite.
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const globalForDb = globalThis as unknown as { db?: Db; pglite?: PGlite };

function createDb(): Db {
  if (process.env.DATABASE_URL) {
    return drizzleNeon(neon(process.env.DATABASE_URL), {
      schema,
    }) as unknown as Db;
  }
  const pglite = globalForDb.pglite ?? new PGlite("./.pglite");
  globalForDb.pglite = pglite;
  return drizzlePglite(pglite, { schema }) as unknown as Db;
}

export const db: Db = globalForDb.db ?? createDb();
// Cache across HMR reloads in dev so PGlite isn't reopened per reload.
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
