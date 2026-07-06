import { AuthForm } from "@/components/forms/AuthForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-ink">Expense Tracker</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Create an account to start staying under budget.
          </p>
        </div>
        <AuthForm mode="signup" />
      </div>
    </main>
  );
}
