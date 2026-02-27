import type { ReactNode } from "react";
import { cn } from "./cn";

type ListCardProps = {
  title: string;
  description?: string;
  meta?: string;
  aside?: ReactNode;
  className?: string;
};

export function ListCard({ title, description, meta, aside, className }: ListCardProps) {
  return (
    <article className={cn("rounded-xl border border-ink-border bg-[var(--color-surface)] p-4 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl font-bold leading-tight text-ink">{title}</h3>
          {description ? <p className="mt-2 text-sm text-ink/70">{description}</p> : null}
          {meta ? <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-ink/55">{meta}</p> : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
    </article>
  );
}
