import type { ReactNode } from "react";
import { cn } from "./cn";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

export function SectionHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-end md:justify-between", className)}>
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/55">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 font-serif text-3xl font-bold text-ink md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-3xl text-sm text-ink/70 md:text-[15px]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
