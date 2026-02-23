"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function ResetPasswordForm({ token }: { token: string }) {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        setIsPending(true);

        try {
            const response = await fetch("/api/auth/reset", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(payload.error ?? "Failed to reset password.");
                return;
            }

            // Automatically sign them in and redirect
            router.push("/login?success=password-reset");
            router.refresh();
        } finally {
            setIsPending(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="password">New Password</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-700 focus:ring-2"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="confirmPassword">Confirm Password</label>
                <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-700 focus:ring-2"
                    required
                />
            </div>

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}

            <button
                type="submit"
                disabled={isPending}
                className="mt-4 w-full rounded-none bg-[#1E3A8A] px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
                {isPending ? "Updating..." : "Confirm new password"}
            </button>
        </form>
    );
}
