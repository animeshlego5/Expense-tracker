"use client";

import { useState, useTransition } from "react";
import { setSubscriptionActive } from "@/actions/subscriptions";

export function SubscriptionToggle({
  id,
  initial,
}: {
  id: string;
  initial: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      await setSubscriptionActive(id, next);
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? "Active — tap to pause" : "Paused — tap to activate"}
      onClick={toggle}
      disabled={isPending}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        on ? "bg-positive" : "bg-hairline"
      } disabled:opacity-60`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-surface shadow transition-[left] ${
          on ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}
