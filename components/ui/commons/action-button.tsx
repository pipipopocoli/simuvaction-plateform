import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variantClasses: Record<NonNullable<ActionButtonProps["variant"]>, string> = {
  primary: "bg-ink-blue text-white hover:bg-ink-blue/90",
  secondary: "bg-white text-ink border border-ink-border hover:border-ink-blue hover:text-ink-blue",
  ghost: "bg-ink/5 text-ink hover:bg-ink/10",
};

export function ActionButton({ className, variant = "primary", type = "button", ...props }: ActionButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
