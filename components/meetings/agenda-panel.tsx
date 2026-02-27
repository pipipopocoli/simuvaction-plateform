"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Panel, TimelineItem } from "@/components/ui/commons";

type CalendarEvent = {
  id: string;
  type: "deadline" | "meeting";
  title: string;
  startsAt: string;
  details: string;
  deepLink: string | null;
};

export function AgendaPanel({ limit = 5 }: { limit?: number }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/calendar/events", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { events: CalendarEvent[] };
      setEvents(payload.events.slice(0, limit));
    }

    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [limit]);

  return (
    <Panel variant="soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-2xl font-bold text-ink">Agenda</h3>
        <CalendarDays className="h-5 w-5 text-ink-blue" />
      </div>

      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-ink/60">No event scheduled.</p>
        ) : (
          events.map((event) => (
            <div key={event.id}>
              <TimelineItem
                time={new Date(event.startsAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                title={event.title}
                details={event.details}
                tone={event.type === "meeting" ? "accent" : "alert"}
              />
              {event.deepLink ? (
                <Link href={event.deepLink} className="ml-4 text-xs font-semibold text-ink-blue hover:underline">
                  Open
                </Link>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
