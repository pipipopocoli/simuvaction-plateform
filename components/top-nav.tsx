"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import type { SessionPayload } from "@/lib/auth";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/chat", label: "Comms (Chat)" },
  { href: "/pillars", label: "Pillars" },
  { href: "/library", label: "Library" },
  { href: "/x", label: "X Tracker" },
  { href: "/settings", label: "Settings" },
];

export function TopNav({ session }: { session?: SessionPayload }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-300 bg-zinc-100/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between px-8">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-700">
          Plateforme SimuVaction
          {session && (
            <span className="ml-4 rounded-full bg-zinc-800 px-2 py-0.5 text-[0.65rem] text-zinc-100">
              {session.role}
            </span>
          )}
        </div>

        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-1.5 text-sm transition ${active
                  ? "bg-zinc-900 text-zinc-50"
                  : "text-zinc-700 hover:bg-zinc-200"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <LogoutButton />
      </div>
    </header>
  );
}
