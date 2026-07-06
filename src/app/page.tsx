import { redirect } from "next/navigation";

// Placeholder: the auth foundation replaces this with a session-aware
// redirect (session ? /dashboard : /login).
export default function Home() {
  redirect("/login");
}
