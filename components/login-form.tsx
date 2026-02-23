"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pass: password }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 429) {
          setError(`Trop de tentatives. Réessayez dans ${payload.retryAfterSeconds ?? "quelques"} secondes.`);
          return;
        }
        setError(payload.error ?? "Échec de connexion.");
        return;
      }

      // Redirect to specific workspace based on role or fallback to requested URL
      const role = payload.role as string;
      const nextPath = searchParams.get("next");

      let defaultPath = "/";
      if (role === "delegate") defaultPath = "/workspace/delegate";
      if (role === "journalist") defaultPath = "/workspace/journalist";
      if (role === "leader") defaultPath = "/workspace/leader";
      if (role === "lobbyist") defaultPath = "/workspace/lobbyist";
      if (role === "admin") defaultPath = "/workspace/leader";

      router.push(nextPath && nextPath.startsWith("/") ? nextPath : defaultPath);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700" htmlFor="email">Email Address</label>
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

      <div>
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-zinc-700" htmlFor="password">Password</label>
          <a href="/login/forgot" className="text-xs text-zinc-500 hover:text-black hover:underline transition-colors mt-0">
            Forgot password?
          </a>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-zinc-500">Par défaut: 1234</span>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password..."
          className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-700 focus:ring-2"
          required
        />
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 w-full rounded bg-black px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Authenticating..." : "Enter War Room"}
      </button>
    </form>
  );
}
