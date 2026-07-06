"use client";

import { useActionState } from "react";
import { updateCategoryBudgets, type FormState } from "@/actions/settings";
import { CATEGORIES, type ExpenseCategory } from "@/lib/categories";

export function CategoryBudgetsForm({
  current,
}: {
  current: Partial<Record<ExpenseCategory, number>>; // paise per category
}) {
  const [state, formAction, isPending] = useActionState<FormState | null, FormData>(
    updateCategoryBudgets,
    null
  );
  const error = state && "error" in state ? state.error : null;
  const ok = Boolean(state && "ok" in state);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-hairline bg-surface p-4"
    >
      <div>
        <p className="text-sm font-medium text-ink-soft">Category budgets</p>
        <p className="mt-0.5 text-xs text-ink-soft">
          Optional monthly cap per category. Overspent categories are
          highlighted on the dashboard pie chart. Leave empty for no cap.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {CATEGORIES.map((c) => {
          const paise = current[c.key];
          return (
            <label key={c.key} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded"
                style={{ backgroundColor: c.color }}
              />
              <span className="w-28 shrink-0 text-sm text-ink">{c.label}</span>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
                  ₹
                </span>
                <input
                  name={c.key}
                  inputMode="decimal"
                  placeholder="No cap"
                  defaultValue={
                    paise !== undefined ? (paise / 100).toString() : ""
                  }
                  className="h-11 w-full rounded-lg border border-hairline bg-cream pl-7 pr-3 text-ink outline-none transition-colors focus:border-ink"
                />
              </div>
            </label>
          );
        })}
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
        {isPending ? "Saving…" : "Save category budgets"}
      </button>
    </form>
  );
}
