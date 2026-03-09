"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Video } from "lucide-react";
import { Panel, StatusBadge } from "@/components/ui/commons";

type MeetingAttendee = {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  teamName: string | null;
  preferredTimeZone: string;
};

type MeetingRequestEntry = {
  id: string;
  title: string;
  note: string | null;
  status: string;
  recipientMode: string;
  proposedStartAt: string;
  scheduledStartAt: string | null;
  organizerTimeZone: string | null;
  requester: { id: string; name: string; role: string; avatarUrl: string | null };
  targetUser: { id: string; name: string; role: string; avatarUrl: string | null } | null;
  targetLabel: string | null;
  attendees: MeetingAttendee[];
  chatRoom: { id: string; name: string } | null;
  meetingSession: { id: string; status: string; googleMeetUrl: string | null } | null;
};

type Payload = {
  incoming: MeetingRequestEntry[];
  outgoing: MeetingRequestEntry[];
};

export function MeetingRequestsPanel() {
  const [payload, setPayload] = useState<Payload>({ incoming: [], outgoing: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [scheduleOverrides, setScheduleOverrides] = useState<Record<string, string>>({});

  async function load() {
    const response = await fetch("/api/meetings/requests", { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const nextPayload = (await response.json()) as Payload;
    setPayload(nextPayload);
  }

  useEffect(() => {
    load().finally(() => setIsLoading(false));
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  async function updateRequest(id: string, decision: "accept" | "decline" | "cancel") {
    setIsUpdatingId(id);
    try {
      const scheduledStartAt = scheduleOverrides[id]
        ? new Date(scheduleOverrides[id]).toISOString()
        : undefined;

      await fetch(`/api/meetings/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, scheduledStartAt }),
      });
      await load();
    } finally {
      setIsUpdatingId(null);
    }
  }

  function renderRequestCard(request: MeetingRequestEntry, mode: "incoming" | "outgoing") {
    const isPending = request.status === "pending";
    const attendeeLabel =
      request.recipientMode === "team"
        ? request.targetLabel || "Delegation"
        : request.attendees.map((attendee) => attendee.name).join(", ");

    return (
      <div
        key={request.id}
        className={`rounded-lg border p-3 ${mode === "incoming" ? "bg-white" : "bg-ivory"} border-ink-border`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">{request.title}</p>
            <p className="text-xs text-ink/60">
              {mode === "incoming" ? `From ${request.requester.name}` : `To ${attendeeLabel || request.targetLabel || "group"}`}
            </p>
            <p className="mt-1 text-xs text-ink/60">
              {new Date(request.scheduledStartAt ?? request.proposedStartAt).toLocaleString([], {
                dateStyle: "short",
                timeStyle: "short",
              })}{" "}
              · organizer timezone {request.organizerTimeZone || "UTC"}
            </p>
            {request.note ? <p className="mt-1 text-xs text-ink/70">{request.note}</p> : null}
          </div>
          <StatusBadge tone={request.status === "accepted" ? "live" : request.status === "pending" ? "alert" : "neutral"}>
            {request.status}
          </StatusBadge>
        </div>

        {request.attendees.length > 0 ? (
          <div className="mt-3 rounded-lg border border-ink-border bg-[var(--color-surface)] p-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink/55">Attendees</p>
            <div className="mt-1 space-y-1 text-xs text-ink/75">
              {request.attendees.map((attendee) => (
                <p key={attendee.id}>
                  {attendee.name} ({attendee.teamName ?? attendee.role}) · {attendee.preferredTimeZone}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {isPending && mode === "incoming" ? (
          <div className="mt-3 space-y-2">
            <input
              type="datetime-local"
              value={scheduleOverrides[request.id] ?? ""}
              onChange={(event) =>
                setScheduleOverrides((current) => ({
                  ...current,
                  [request.id]: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateRequest(request.id, "accept")}
                disabled={isUpdatingId === request.id}
                className="rounded bg-ink-blue px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {isUpdatingId === request.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Accept"}
              </button>
              <button
                type="button"
                onClick={() => updateRequest(request.id, "decline")}
                disabled={isUpdatingId === request.id}
                className="rounded border border-ink-border bg-white px-3 py-1.5 text-xs font-semibold text-ink disabled:opacity-60"
              >
                Decline
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold">
          {mode === "outgoing" && isPending ? (
            <button
              type="button"
              onClick={() => updateRequest(request.id, "cancel")}
              disabled={isUpdatingId === request.id}
              className="rounded border border-ink-border bg-white px-3 py-1.5 text-ink disabled:opacity-60"
            >
              Cancel
            </button>
          ) : null}
          {request.chatRoom ? (
            <Link href={`/chat/${request.chatRoom.id}`} className="text-ink-blue hover:underline">
              Open room
            </Link>
          ) : null}
          {request.meetingSession ? (
            <Link href={`/meetings/${request.meetingSession.id}`} className="inline-flex items-center gap-1 text-ink-blue hover:underline">
              <Video className="h-3.5 w-3.5" />
              Join video
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-2xl font-bold text-ink">Meetings</h3>
        <StatusBadge tone="neutral">
          {`${payload.incoming.filter((entry) => entry.status === "pending").length} pending`}
        </StatusBadge>
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-ink/60">Loading requests...</p>
      ) : (
        <div className="mt-3 space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Incoming</p>
            <div className="mt-2 space-y-2">
              {payload.incoming.length === 0 ? (
                <p className="text-sm text-ink/60">No incoming request.</p>
              ) : (
                payload.incoming.map((request) => renderRequestCard(request, "incoming"))
              )}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Outgoing</p>
            <div className="mt-2 space-y-2">
              {payload.outgoing.length === 0 ? (
                <p className="text-sm text-ink/60">No outgoing request.</p>
              ) : (
                payload.outgoing.map((request) => renderRequestCard(request, "outgoing"))
              )}
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}
