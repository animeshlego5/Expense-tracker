"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    await authClient.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="h-11 w-full rounded-lg border border-hairline font-medium text-critical transition-opacity disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
