import { ForgotPasswordForm } from "./forgot-form";

export default function ForgotPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-6 bg-[#FFFBF5]">
            <div className="w-full max-w-md rounded-none p-8 shadow-xl bg-white border border-[#E5E7EB]">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 text-center">Simuvaction</p>
                <h1 className="mt-2 text-3xl font-bold text-[#111827] text-center uppercase tracking-wider font-serif">Account Recovery</h1>
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
