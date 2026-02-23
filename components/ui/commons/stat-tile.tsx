import { cn } from "./cn";

type StatTileProps = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "accent" | "alert";
  className?: string;
};

const toneClasses: Record<NonNullable<StatTileProps["tone"]>, string> = {
  default: "border-ink-border bg-white",
  accent: "border-blue-200 bg-blue-50/70",
  alert: "border-red-200 bg-red-50/70",
};

export function StatTile({ label, value, hint, tone = "default", className }: StatTileProps) {
  return (
    <div className={cn("rounded-xl border p-4", toneClasses[tone], className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/55">{label}</p>
      <p className="mt-2 font-serif text-3xl font-bold leading-none text-ink">{value}</p>
      {hint ? <p className="mt-2 text-xs text-ink/65">{hint}</p> : null}
    </div>
  );
}
