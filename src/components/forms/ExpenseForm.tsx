"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { addExpense, updateExpense, type FormState } from "@/actions/expenses";
import { CATEGORIES, type ExpenseCategory } from "@/lib/categories";

type Initial = {
  id: string;
  amountPaise: number;
  category: ExpenseCategory;
  note: string | null;
  occurredOn: string;
};

const inputClass =
  "h-11 w-full rounded-lg border border-hairline bg-cream px-3 text-ink outline-none transition-colors focus:border-ink";
const labelClass = "text-sm font-medium text-ink-soft";

export function ExpenseForm({
  today,
  initial,
  cancelHref,
}: {
  today: string;
  initial?: Initial;
  cancelHref?: string;
}) {
  const isEdit = Boolean(initial);
  const [state, formAction, isPending] = useActionState<FormState | null, FormData>(
    isEdit ? updateExpense : addExpense,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isEdit && state && "ok" in state) formRef.current?.reset();
  }, [state, isEdit]);

  const error = state && "error" in state ? state.error : null;
  const defaultCategory = initial?.category ?? CATEGORIES[0].key;

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-hairline bg-surface p-4"
    >
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="amount" className={labelClass}>
          Amount
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
            ₹
          </span>
          <input
            id="amount"
            name="amount"
            inputMode="decimal"
            required
            placeholder="0"
            defaultValue={initial ? (initial.amountPaise / 100).toString() : ""}
            className={`${inputClass} pl-7`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>Category</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <label
              key={c.key}
              className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-hairline bg-cream px-3 text-sm text-ink transition-colors has-[:checked]:border-ink has-[:checked]:font-medium"
            >
              <input
                type="radio"
                name="category"
                value={c.key}
                defaultChecked={c.key === defaultCategory}
                className="sr-only"
              />
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              {c.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="note" className={labelClass}>
          Note <span className="font-normal text-ink-soft/70">(optional)</span>
        </label>
        <input
          id="note"
          name="note"
          type="text"
          maxLength={200}
          defaultValue={initial?.note ?? ""}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="occurredOn" className={labelClass}>
          Date
        </label>
        <input
          id="occurredOn"
          name="occurredOn"
          type="date"
          required
          max={today}
          defaultValue={initial?.occurredOn ?? today}
          className={inputClass}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-critical">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        {isEdit && cancelHref && (
          <Link
            href={cancelHref}
            className="flex h-11 flex-1 items-center justify-center rounded-lg border border-hairline font-medium text-ink"
          >
            Cancel
          </Link>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="h-11 flex-1 rounded-lg bg-ink font-medium text-cream transition-opacity disabled:opacity-60"
        >
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Add expense"}
        </button>
      </div>
    </form>
  );
}
