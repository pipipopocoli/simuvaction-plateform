import type { ReactNode } from "react";
import { cn } from "./cn";

type MapOverlayChipProps = {
  label: string;
  icon?: ReactNode;
  tone?: "neutral" | "accent" | "alert";
  className?: string;
};

const toneStyles: Record<NonNullable<MapOverlayChipProps["tone"]>, string> = {
  neutral: "border-ink-border text-ink bg-white/92",
  accent: "border-blue-200 text-blue-800 bg-blue-50/90",
  alert: "border-red-200 text-red-700 bg-red-50/90",
};

export function MapOverlayChip({ label, icon, tone = "neutral", className }: MapOverlayChipProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur",
        toneStyles[tone],
        className,
      )}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
