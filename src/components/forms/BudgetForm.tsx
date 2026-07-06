"use client";

import { useActionState } from "react";
import { updateBudget, type FormState } from "@/actions/settings";

export function BudgetForm({ currentPaise }: { currentPaise: number }) {
  const [state, formAction, isPending] = useActionState<FormState | null, FormData>(
    updateBudget,
    null
  );
  const error = state && "error" in state ? state.error : null;
  const ok = Boolean(state && "ok" in state);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-hairline bg-surface p-4"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="budget" className="text-sm font-medium text-ink-soft">
          Monthly budget
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
            ₹
          </span>
          <input
            id="budget"
            name="amount"
            inputMode="decimal"
            required
            defaultValue={(currentPaise / 100).toString()}
            className="h-11 w-full rounded-lg border border-hairline bg-cream pl-7 pr-3 text-ink outline-none transition-colors focus:border-ink"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-critical">
          {error}
        </p>
      )}
      {ok && !error && (
        <p role="status" className="text-sm text-ink-soft">
          Saved
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-lg bg-ink font-medium text-cream transition-opacity disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save budget"}
      </button>
    </form>
  );
}
