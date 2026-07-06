import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { istToday } from "@/lib/dates";

export default function AddExpensePage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Add expense</h1>
        <p className="text-sm text-ink-soft">
          Log it now, forget it never.
        </p>
      </div>
      <ExpenseForm today={istToday()} />
    </div>
  );
}
