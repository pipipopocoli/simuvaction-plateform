"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import { Calendar } from "lucide-react";
import { Panel, StatusBadge } from "@/components/ui/commons";

type WorkspaceCalendarEvent = {
  id: string;
  type: "deadline" | "meeting";
  title: string;
  startsAt: string;
  endsAt?: string;
  details: string;
  deepLink: string | null;
  visibilityScope: "global" | "personal" | "team";
  source: "event_deadline" | "official_deadline" | "meeting_request";
};

function dayKey(date: DateTime) {
  return date.toISODate() ?? "";
}

export function WorkspaceCalendar() {
  const [events, setEvents] = useState<WorkspaceCalendarEvent[]>([]);
  const [monthCursor, setMonthCursor] = useState(() => DateTime.local().startOf("month"));
  const [selectedDay, setSelectedDay] = useState(() => dayKey(DateTime.local()));

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/calendar/events", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { events: WorkspaceCalendarEvent[] };
      setEvents(payload.events);
    }

    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  const daysInGrid = useMemo(() => {
    const start = monthCursor.startOf("month");
    const end = monthCursor.endOf("month");
    const startWeekday = start.weekday % 7;
    const totalCells = Math.ceil((startWeekday + end.day) / 7) * 7;

    return Array.from({ length: totalCells }).map((_, index) => start.minus({ days: startWeekday }).plus({ days: index }));
  }, [monthCursor]);

  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, WorkspaceCalendarEvent[]>();
    for (const event of events) {
      const date = DateTime.fromISO(event.startsAt);
      if (!date.isValid) continue;
      const key = dayKey(date);
      const current = grouped.get(key) ?? [];
      current.push(event);
      grouped.set(key, current);
    }
    return grouped;
  }, [events]);

  const selectedEvents = eventsByDay.get(selectedDay) ?? [];

  return (
    <Panel variant="soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-2xl font-bold text-ink">Calendar</h3>
        <Calendar className="h-5 w-5 text-ink-blue" />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthCursor((current) => current.minus({ months: 1 }))}
          className="rounded-md border border-ink-border bg-[var(--color-surface)] px-2 py-1 text-xs font-semibold text-ink"
        >
          Prev
        </button>
        <p className="text-sm font-semibold text-ink">{monthCursor.toFormat("LLLL yyyy")}</p>
        <button
          type="button"
          onClick={() => setMonthCursor((current) => current.plus({ months: 1 }))}
          className="rounded-md border border-ink-border bg-[var(--color-surface)] px-2 py-1 text-xs font-semibold text-ink"
        >
          Next
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/55">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {daysInGrid.map((day) => {
          const key = dayKey(day);
          const isCurrentMonth = day.month === monthCursor.month;
          const hasEvents = (eventsByDay.get(key)?.length ?? 0) > 0;
          const isSelected = selectedDay === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDay(key)}
              className={`relative h-9 rounded-md border text-xs font-semibold transition ${
                isSelected
                  ? "border-ink-blue bg-ink-blue text-white"
                  : isCurrentMonth
                    ? "border-ink-border bg-[var(--color-surface)] text-ink hover:border-ink-blue/40"
                    : "border-ink-border/60 bg-transparent text-ink/40"
              }`}
            >
              {day.day}
              {hasEvents ? (
                <span
                  className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                    isSelected ? "bg-white" : "bg-ink-blue"
                  }`}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink/55">
          {DateTime.fromISO(selectedDay).toFormat("dd LLL yyyy")}
        </p>
        <div className="mt-2 space-y-2">
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-ink/60">No event on this date.</p>
          ) : (
            selectedEvents.map((event) => (
              <div key={event.id} className="rounded-lg border border-ink-border bg-[var(--color-surface)] p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{event.title}</p>
                  <StatusBadge tone={event.type === "meeting" ? "live" : "alert"}>{event.type}</StatusBadge>
                </div>
                <p className="mt-1 text-xs text-ink/65">{DateTime.fromISO(event.startsAt).toFormat("HH:mm")}</p>
                <p className="mt-1 text-xs text-ink/70">{event.details}</p>
                {event.deepLink ? (
                  <Link href={event.deepLink} className="mt-1 inline-flex text-xs font-semibold text-ink-blue hover:underline">
                    Open
                  </Link>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </Panel>
  );
}
