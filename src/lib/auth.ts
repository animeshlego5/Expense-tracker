import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { userSettings } from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  session: {
    // 60-day sliding sessions ("stay logged in"): re-issued at most daily.
    expiresIn: 60 * 60 * 24 * 60,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  databaseHooks: {
    user: {
      create: {
        // Seed a settings row so every user has a monthly budget on day one.
        // The default budget comes from the column default.
        after: async (user) => {
          await db
            .insert(userSettings)
            .values({ userId: user.id })
            .onConflictDoNothing();
        },
      },
    },
  },
  // nextCookies must be the last plugin so it can flush Set-Cookie headers.
  plugins: [nextCookies()],
});
