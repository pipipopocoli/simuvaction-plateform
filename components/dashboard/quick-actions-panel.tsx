"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Plus } from "lucide-react";
import { ActionButton, Panel, TimelineItem } from "@/components/ui/commons";

type Contact = {
  id: string;
  name: string;
  role: string;
  teamId: string | null;
  teamName: string | null;
};

type CalendarEvent = {
  id: string;
  type: "deadline" | "meeting";
  title: string;
  startsAt: string;
  details: string;
  deepLink: string | null;
};

export function QuickActionsPanel({ role }: { role: string }) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [agenda, setAgenda] = useState<CalendarEvent[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [meetingNote, setMeetingNote] = useState("");
  const [meetingDateTime, setMeetingDateTime] = useState("");
  const [mode, setMode] = useState<"none" | "message" | "meeting">("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [contactsResponse, calendarResponse] = await Promise.all([
        fetch("/api/chat/contacts", { cache: "no-store" }),
        fetch("/api/calendar/events", { cache: "no-store" }),
      ]);

      if (contactsResponse.ok) {
        const payload = (await contactsResponse.json()) as Contact[];
        setContacts(payload);
      }

      if (calendarResponse.ok) {
        const payload = (await calendarResponse.json()) as { events: CalendarEvent[] };
        setAgenda(payload.events.slice(0, 4));
      }
    }

    load();
  }, []);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) ?? null,
    [contacts, selectedContactId],
  );

  async function openMessage() {
    if (!selectedContactId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomType: "direct",
          targetUserId: selectedContactId,
        }),
      });

      if (!response.ok) {
        setError("Unable to open direct thread.");
        return;
      }

      const room = (await response.json()) as { id: string };
      setMode("none");
      router.push(`/chat/${room.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestMeeting() {
    if (!selectedContactId || !meetingDateTime) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/meetings/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedContactId,
          targetTeamId: selectedContact?.teamId,
          title: selectedContact?.teamName
            ? `Meeting request: ${selectedContact.teamName}`
            : `Meeting request: ${selectedContact?.name}`,
          note: meetingNote || undefined,
          proposedStartAt: new Date(meetingDateTime).toISOString(),
          durationMin: 30,
        }),
      });

      if (!response.ok) {
        setError("Unable to send meeting request.");
        return;
      }

      setMode("none");
      setMeetingNote("");
      setMeetingDateTime("");

      const calendarResponse = await fetch("/api/calendar/events", { cache: "no-store" });
      if (calendarResponse.ok) {
        const payload = (await calendarResponse.json()) as { events: CalendarEvent[] };
        setAgenda(payload.events.slice(0, 4));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Panel className="xl:col-span-3">
      <h2 className="font-serif text-3xl font-bold text-ink">Quick Actions</h2>

      <div className="mt-4 space-y-3">
        {(role === "leader" || role === "admin") && (
          <ActionButton className="w-full justify-between" onClick={() => router.push("/votes")}> 
            Create Vote
            <ChevronRight className="h-4 w-4" />
          </ActionButton>
        )}

        {(role === "journalist" || role === "admin") && (
          <ActionButton variant="secondary" className="w-full justify-between" onClick={() => router.push("/newsroom")}>
            Submit Article
            <ChevronRight className="h-4 w-4" />
          </ActionButton>
        )}

        <ActionButton variant="secondary" className="w-full justify-between" onClick={() => setMode("message")}>
          Open Messages
          <ChevronRight className="h-4 w-4" />
        </ActionButton>

        <ActionButton variant="ghost" className="w-full justify-between" onClick={() => setMode("meeting")}>
          Request Meeting
          <Plus className="h-4 w-4" />
        </ActionButton>
      </div>

      {mode !== "none" ? (
        <div className="mt-4 space-y-3 rounded-lg border border-ink-border bg-ivory p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">
            {mode === "message" ? "Open direct thread" : "New meeting request"}
          </p>

          <select
            value={selectedContactId}
            onChange={(event) => setSelectedContactId(event.target.value)}
            className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
          >
            <option value="">Select a member</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name} ({contact.teamName ?? contact.role})
              </option>
            ))}
          </select>

          {mode === "meeting" ? (
            <>
              <input
                type="datetime-local"
                value={meetingDateTime}
                onChange={(event) => setMeetingDateTime(event.target.value)}
                className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
              />
              <textarea
                value={meetingNote}
                onChange={(event) => setMeetingNote(event.target.value)}
                placeholder="Meeting note (optional)"
                className="min-h-[90px] w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
              />
            </>
          ) : null}

          {error ? <p className="text-xs text-alert-red">{error}</p> : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("none")}
              className="flex-1 rounded-lg border border-ink-border bg-white px-3 py-2 text-xs font-semibold text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting || !selectedContactId || (mode === "meeting" && !meetingDateTime)}
              onClick={mode === "message" ? openMessage : requestMeeting}
              className="flex-1 rounded-lg bg-ink-blue px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving
                </span>
              ) : mode === "message" ? (
                "Open thread"
              ) : (
                "Send request"
              )}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/55">My Agenda</h3>
        {agenda.length === 0 ? (
          <p className="text-sm text-ink/60">No upcoming events.</p>
        ) : (
          agenda.map((event) => (
            <TimelineItem
              key={event.id}
              time={new Date(event.startsAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
              title={event.title}
              details={event.details}
              tone={event.type === "meeting" ? "accent" : "alert"}
            />
          ))
        )}
      </div>
    </Panel>
  );
}
