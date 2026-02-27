"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Globe2, Search, Settings } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { SessionPayload } from "@/lib/auth";

const navItems = [
  { href: "/", label: "Front Page" },
  { href: "/atlas", label: "Atlas" },
  { href: "/newsroom", label: "Newsroom" },
  { href: "/votes", label: "Votes" },
  { href: "/chat", label: "Messages" },
  { href: "/archive", label: "Archive" },
];

function getActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function TopNav({ session }: { session?: SessionPayload }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-ink-border bg-[#f8f4ec]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-ink-blue/30 bg-white text-ink-blue shadow-sm">
            <Globe2 className="h-5 w-5" />
          </span>
          <div>
            <p className="font-serif text-[34px] leading-none text-ink">SimuVaction <span className="text-ink-blue">Commons</span></p>
          </div>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active = getActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-md px-3 py-2 text-sm font-semibold transition-colors ${active ? "text-ink-blue" : "text-ink/70 hover:text-ink"
                  }`}
              >
                {item.label}
                {active ? <span className="absolute inset-x-2 -bottom-[13px] h-[3px] rounded-full bg-ink-blue" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <label className="hidden items-center gap-2 rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink/60 shadow-sm md:flex">
            <Search className="h-4 w-4" />
            <input
              aria-label="Search"
              placeholder="Search..."
              className="w-48 bg-transparent text-ink outline-none placeholder:text-ink/40"
            />
          </label>

          <button className="relative rounded-lg border border-ink-border bg-white p-2 text-ink/70 transition hover:text-ink">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-alert-red text-[10px] font-bold text-white">3</span>
          </button>

          {session ? (
            <Link href={`/workspace/${session.role}`}>
              <div className="hidden items-center gap-3 rounded-xl border border-ink-border bg-white px-3 py-2 shadow-sm hover:border-ink-blue/40 transition cursor-pointer sm:flex">
                {session.avatarUrl ? (
                  <img src={session.avatarUrl} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {session.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-ink">{session.name}</p>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-ink/55">{session.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-ink/45" />
              </div>
            </Link>
          ) : null}

          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-ink-border/80 px-3 py-2 lg:hidden">
        {navItems.map((item) => {
          const active = getActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ${active ? "bg-ink-blue text-white" : "bg-white text-ink/70"
                }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
