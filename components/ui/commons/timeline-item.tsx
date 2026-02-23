import { cn } from "./cn";

type TimelineItemProps = {
  time: string;
  title: string;
  details?: string;
  tone?: "default" | "accent" | "alert";
  className?: string;
};

const toneDot: Record<NonNullable<TimelineItemProps["tone"]>, string> = {
  default: "bg-slate-400",
  accent: "bg-ink-blue",
  alert: "bg-alert-red",
};

export function TimelineItem({ time, title, details, tone = "default", className }: TimelineItemProps) {
  return (
    <div className={cn("relative border-l border-ink-border pl-4", className)}>
      <span className={cn("absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full", toneDot[tone])} />
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/55">{time}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{title}</p>
      {details ? <p className="mt-1 text-xs text-ink/70">{details}</p> : null}
    </div>
  );
}
