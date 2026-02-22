"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-900 disabled:opacity-50"
    >
      <span>{isPending ? "Logging out..." : "Log out"}</span>
    </button>
  );
}
