import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Server-only guard: returns the current session or redirects to /login.
 * Use in server components / server actions that require an authenticated user.
 */
export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  return session;
}
