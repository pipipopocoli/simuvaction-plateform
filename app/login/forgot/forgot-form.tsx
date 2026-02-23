"use client";

import { FormEvent, useState } from "react";

export function ForgotPasswordForm() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        setIsPending(true);

        try {
            const response = await fetch("/api/auth/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(payload.error ?? "Failed to request reset.");
                return;
            }

            setSuccess(payload.message || "Request mapped successfully.");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="email">Email assigné</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="delegue.france@simuvaction.com"
                    className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-700 focus:ring-2"
                    required
                />
            </div>

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            {success && <p className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 p-3 rounded">{success}</p>}

            {!success && (
                <button
                    type="submit"
                    disabled={isPending}
                    className="mt-4 w-full rounded-none bg-[#1E3A8A] px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isPending ? "Verification..." : "Send Reset Link"}
                </button>
            )}
        </form>
    );
}
