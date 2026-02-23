import { ForgotPasswordForm } from "./forgot-form";

export default function ForgotPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-6 bg-zinc-950">
            <div className="w-full max-w-md rounded-lg p-8 shadow-2xl bg-zinc-50 border border-zinc-200">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 text-center">Simuvaction</p>
                <h1 className="mt-2 text-3xl font-bold text-zinc-900 text-center uppercase tracking-wider">Account Recovery</h1>
                <p className="mt-3 text-sm text-zinc-600 text-center">
                    Enter your assigned email address to receive a secure password reset link.
                </p>

                <div className="mt-8">
                    <ForgotPasswordForm />
                </div>

                <div className="mt-6 text-center">
                    <a href="/login" className="text-sm font-medium text-zinc-600 hover:text-black hover:underline transition-colors">
                        Return to Login
                    </a>
                </div>
            </div>
        </div>
    );
}
