import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
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

  return (
    <>
      <AppShell />
      <main className="mx-auto w-full max-w-md px-4 pb-24 pt-4 lg:max-w-4xl">
        {children}
      </main>
    </>
  );
}
