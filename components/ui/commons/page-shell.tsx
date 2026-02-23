import type { ReactNode } from "react";
import { cn } from "./cn";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-ink-border/80 bg-gradient-to-b from-white to-[#f8f6f2] p-4 md:p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-orange-100/40 blur-3xl" />
      <div className="relative">{children}</div>
    </div>
  );
}
