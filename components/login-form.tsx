"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { resolveWorkspacePath } from "@/lib/authz";

type CredentialMode = "password" | "passphrase";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [mode, setMode] = useState<CredentialMode>("password");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const body =
        mode === "password"
          ? { email, pass: secret }
          : { email, passphrase: secret };

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 429) {
          setError(`Too many attempts. Retry in ${payload.retryAfterSeconds ?? "a few"} seconds.`);
          return;
        }

        setError(payload.error ?? "Login failed.");
        return;
      }

      if (payload.mustChangePassword) {
        router.push("/auth/setup");
        router.refresh();
        return;
      }

      const role = payload.role as string;
      const nextPath = searchParams.get("next");
      const defaultPath = resolveWorkspacePath(role);

      router.push(nextPath && nextPath.startsWith("/") ? nextPath : defaultPath);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="delegate.france@simuvaction.com"
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-700 focus:ring-2"
          required
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium text-zinc-700" htmlFor="secret">
            {mode === "password" ? "Password" : "Legacy passphrase"}
          </label>
          <a
            href="/login/forgot"
            className="text-xs text-zinc-500 transition-colors hover:text-black hover:underline"
          >
            Forgot password?
          </a>
        </div>

        <input
          id="secret"
          name="secret"
          type="password"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          placeholder={mode === "password" ? "Enter your account password" : "Enter legacy passphrase"}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-700 focus:ring-2"
          required
        />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Login mode</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`rounded-md px-2 py-1.5 text-xs font-semibold transition ${
              mode === "password" ? "bg-blue-900 text-white" : "bg-white text-zinc-600"
            }`}
          >
            Individual password
          </button>
          <button
            type="button"
            onClick={() => setMode("passphrase")}
            className={`rounded-md px-2 py-1.5 text-xs font-semibold transition ${
              mode === "passphrase" ? "bg-blue-900 text-white" : "bg-white text-zinc-600"
            }`}
          >
            Legacy passphrase
          </button>
        </div>
      </div>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 w-full rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Authenticating..." : "Enter Commons"}
      </button>
    </form>
  );
}
