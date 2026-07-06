import { defineConfig } from "drizzle-kit";

// With Neon: DIRECT_DATABASE_URL (non-pooled) is required for DDL.
// Without it, drizzle-kit targets the local embedded PGlite database.
export default defineConfig(
  process.env.DIRECT_DATABASE_URL
    ? {
        dialect: "postgresql",
        schema: "./src/db/schema",
        out: "./drizzle",
        dbCredentials: { url: process.env.DIRECT_DATABASE_URL },
      }
    : {
        dialect: "postgresql",
        driver: "pglite",
        schema: "./src/db/schema",
        out: "./drizzle",
        dbCredentials: { url: "./.pglite" },
      }
);
