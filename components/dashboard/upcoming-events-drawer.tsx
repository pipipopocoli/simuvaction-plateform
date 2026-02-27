"use client";

import { DateTime } from "luxon";
import { X } from "lucide-react";

export type DashboardUpcomingEvent = {
  id: string;
  title: string;
  startsAtIso: string;
  description: string | null;
  source: "event_deadline" | "official_deadline";
};

type UpcomingEventsDrawerProps = {
  event: DashboardUpcomingEvent | null;
  onClose: () => void;
};

function toReadable(isoDate: string) {
  const parsed = DateTime.fromISO(isoDate);
  if (!parsed.isValid) {
    return "Unknown schedule";
  }

  return parsed.toUTC().toFormat("dd LLL yyyy HH:mm 'UTC'");
}

export function UpcomingEventsDrawer({ event, onClose }: UpcomingEventsDrawerProps) {
  if (!event) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[75] flex justify-end bg-black/30 p-0 md:p-4">
      <aside className="h-full w-full max-w-md overflow-auto border-l border-ink-border bg-[var(--color-surface)] p-5 shadow-xl md:rounded-xl md:border">
        <button
          type="button"
          onClick={onClose}
          className="mb-4 inline-flex items-center gap-1 rounded-md border border-ink-border px-2 py-1 text-xs font-semibold text-ink/70 hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
          Close
        </button>

        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Upcoming event detail</p>
        <h3 className="mt-2 font-serif text-3xl font-bold text-ink">{event.title}</h3>
        <p className="mt-2 text-sm text-ink/70">{toReadable(event.startsAtIso)}</p>

        <div className="mt-4 rounded-lg border border-ink-border bg-ivory p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Context</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">
            {event.description ?? "No additional context was published for this checkpoint yet."}
          </p>
        </div>

        <p className="mt-4 text-xs uppercase tracking-[0.1em] text-ink/55">
          Source: {event.source === "event_deadline" ? "Event deadline" : "Official baseline timeline"}
        </p>
      </aside>
    </div>
  );
}
