import { cn } from "./cn";

type StatusBadgeProps = {
  children: string;
  tone?: "neutral" | "live" | "alert" | "success";
  className?: string;
};

const toneClasses: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  live: "bg-blue-100 text-blue-800 border-blue-200",
  alert: "bg-red-100 text-red-700 border-red-200",
  success: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function StatusBadge({ children, tone = "neutral", className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em]",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
