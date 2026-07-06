"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { addIncome, updateIncome, type FormState } from "@/actions/income";
import { DateField } from "@/components/forms/DateField";

type Initial = {
  id: string;
  amountPaise: number;
  source: string;
  occurredOn: string;
};

const inputClass =
  "h-11 w-full rounded-lg border border-hairline bg-cream px-3 text-ink outline-none transition-colors focus:border-ink";
const labelClass = "text-sm font-medium text-ink-soft";

export function IncomeForm({
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
    isEdit ? updateIncome : addIncome,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isEdit && state && "ok" in state) formRef.current?.reset();
  }, [state, isEdit]);

  const error = state && "error" in state ? state.error : null;

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
        <label htmlFor="source" className={labelClass}>
          Source
        </label>
        <input
          id="source"
          name="source"
          type="text"
          required
          maxLength={100}
          placeholder="Salary, Freelance, …"
          defaultValue={initial?.source ?? ""}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>Date</span>
        <DateField name="occurredOn" today={today} initial={initial?.occurredOn} />
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
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Add income"}
        </button>
      </div>
    </form>
  );
}
