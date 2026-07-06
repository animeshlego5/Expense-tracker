"use client";

import { useState, useTransition } from "react";
import { setHideIncome } from "@/actions/settings";

export function StudentToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      await setHideIncome(next);
    });
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-hairline bg-surface p-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">Student mode</p>
        <p className="text-sm text-ink-soft">
          Living on pocket money? Hide income tracking everywhere — only the
          budget is shown.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Student mode"
        onClick={toggle}
        disabled={isPending}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          on ? "bg-ink" : "bg-hairline"
        } disabled:opacity-60`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-surface shadow transition-[left] ${
            on ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
