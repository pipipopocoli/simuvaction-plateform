import type { ReactNode } from "react";
import { cn } from "./cn";

type PanelProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "soft" | "elevated";
};

const variantClasses: Record<NonNullable<PanelProps["variant"]>, string> = {
  default: "bg-white border border-ink-border shadow-sm",
  soft: "bg-[#f7f5f1] border border-ink-border/70 shadow-sm",
  elevated: "bg-white border border-ink-border shadow-[0_16px_35px_rgba(15,23,42,0.08)]",
};

export function Panel({ children, className, variant = "default" }: PanelProps) {
  return <section className={cn("rounded-xl p-4 md:p-5", variantClasses[variant], className)}>{children}</section>;
}
