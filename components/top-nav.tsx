"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import type { SessionPayload } from "@/lib/auth";
import { Search, Bell, User } from "lucide-react";

const navItems = [
  { href: "/", label: "Front Page" },
  { href: "/atlas", label: "Atlas" },
  { href: "/newsroom", label: "Newsroom" },
  { href: "/votes", label: "Votes" },
  { href: "/chat", label: "Messages" },
  { href: "/archive", label: "Archive" },
];

export function TopNav({ session }: { session?: SessionPayload }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-ink-border bg-[#FFFBF5]/95 backdrop-blur supports-[backdrop-filter]:bg-[#FFFBF5]/80">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">

        {/* Logo / Brand */}
        <div className="flex items-center gap-4">
          <Link href="/" className="font-serif font-bold text-xl tracking-tight text-[#111827]">
            SimuVaction <span className="text-[#1E3A8A] font-normal italic">Commons</span>
          </Link>
        </div>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm font-medium transition-colors ${active
                    ? "text-[#1E3A8A] border-b-2 border-[#1E3A8A]"
                    : "text-[#111827]/70 hover:text-[#111827] hover:bg-[#111827]/5 rounded-t-md"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Tools & User */}
        <div className="flex items-center gap-4">
          <button className="text-[#111827]/70 hover:text-[#111827] transition-colors">
            <Search className="w-5 h-5" />
          </button>

          <button className="relative text-[#111827]/70 hover:text-[#111827] transition-colors">
            <Bell className="w-5 h-5" />
            {/* Notification Badge Placeholder */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-bold text-white ring-2 ring-[#FFFBF5]">
              3
            </span>
          </button>

          <div className="h-6 w-px bg-ink-border mx-1"></div>

          {session && (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-semibold text-[#111827]">{session.teamId ? session.teamId.toUpperCase() : "STAFF"}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#111827]/60">{session.role}</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-[#1E3A8A]/10 border border-[#1E3A8A]/20 flex items-center justify-center text-[#1E3A8A]">
                <User className="w-4 h-4" />
              </div>
            </div>
          )}

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
