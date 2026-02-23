import { ForgotPasswordForm } from "./forgot-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f1e9] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#e2e6ee] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">SimuVaction</p>
        <h1 className="mt-2 text-center font-serif text-4xl font-bold text-[#111827]">Account Recovery</h1>
        <p className="mt-3 text-center text-sm text-zinc-600">Enter your account email to receive a secure reset link.</p>

        <div className="mt-8">
          <ForgotPasswordForm />
        </div>

        <div className="mt-6 text-center">
          <a href="/login" className="text-sm font-medium text-zinc-600 transition-colors hover:text-black hover:underline">
            Return to login
          </a>
        </div>
      </div>
    </div>
  );
}
