// Dev utility: seed demo data for an existing user.
// Usage: bunx tsx scripts/seed.ts <email>   (stop the dev server first — PGlite is single-process)
// Note: run under Node (tsx), not `bun` — PGlite's WASM aborts under Bun on Windows.
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { expenses, incomes, user, userSettings } from "@/db/schema";
import { istCurrentMonth } from "@/lib/dates";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("usage: bunx tsx scripts/seed.ts <email>");
    process.exit(1);
  }

  const [u] = await db.select().from(user).where(eq(user.email, email));
  if (!u) {
    console.error(`No user found for ${email} — sign up in the app first.`);
    process.exit(1);
  }

  const m = istCurrentMonth();
  const d = (day: number) => `${m}-${String(day).padStart(2, "0")}`;

  const seedExpenses = [
    { amountPaise: 150_000, category: "rent", note: "PG rent share", occurredOn: d(1) },
    { amountPaise: 59_900, category: "subscriptions", note: "Wi-Fi", occurredOn: d(1) },
    { amountPaise: 12_000, category: "food", note: "Breakfast", occurredOn: d(1) },
    { amountPaise: 85_000, category: "food", note: "Groceries", occurredOn: d(2) },
    { amountPaise: 6_000, category: "travel", note: "Metro", occurredOn: d(2) },
    { amountPaise: 43_000, category: "food", note: "Dinner out", occurredOn: d(3) },
    { amountPaise: 78_000, category: "bills", note: "Electricity", occurredOn: d(4) },
    { amountPaise: 34_000, category: "travel", note: "Cab", occurredOn: d(5) },
    { amountPaise: 25_000, category: "miscellaneous", note: "Stationery", occurredOn: d(6) },
  ] as const;

  await db
    .insert(expenses)
    .values(seedExpenses.map((e) => ({ ...e, userId: u.id })));

  await db.insert(incomes).values({
    userId: u.id,
    amountPaise: 4_500_000,
    source: "Salary",
    occurredOn: d(1),
  });

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, u.id));

  const totalPaise = seedExpenses.reduce((s, e) => s + e.amountPaise, 0);
  console.log(
    `Seeded ${seedExpenses.length} expenses (₹${totalPaise / 100}) + 1 income (₹45000) for ${email}`
  );
  console.log(
    `user_settings row: ${settings ? `budget ₹${settings.monthlyBudgetPaise / 100}` : "MISSING (databaseHooks bug!)"}`
  );
  process.exit(0);
}

main();
