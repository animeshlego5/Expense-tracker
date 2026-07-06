import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { AppShell } from "@/components/nav/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const [settings] = await db
    .select({ hideIncome: userSettings.hideIncome })
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id));

  return (
    <>
      <AppShell hideIncome={settings?.hideIncome ?? false} />
      <main className="mx-auto w-full max-w-md px-4 pb-24 pt-4 lg:max-w-4xl">
        {children}
      </main>
    </>
  );
}
