"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import { Loader2, Video } from "lucide-react";
import { Panel, StatusBadge } from "@/components/ui/commons";
import { emitMeetingDataChanged, subscribeMeetingDataChanged } from "@/lib/meeting-client-events";

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
  durationMin: number;
  requester: { id: string; name: string; role: string; avatarUrl: string | null };
  targetUser: { id: string; name: string; role: string; avatarUrl: string | null } | null;
  targetLabel: string | null;
  attendees: MeetingAttendee[];
  chatRoom: { id: string; name: string } | null;
  meetingSession: { id: string; status: string; googleMeetUrl: string | null } | null;
};

type AvailabilityPayload = {
  organizerTimeZone: string;
  participants: Array<{
    id: string;
    name: string;
    teamName: string | null;
    preferredTimeZone: string;
    isOrganizer: boolean;
  }>;
  suggestedSlots: Array<{
    startsAt: string;
    endsAt: string;
    participantTimes: Array<{
      userId: string;
      name: string;
      timeZone: string;
      localStart: string;
      localEnd: string;
    }>;
  }>;
};

type Payload = {
  incoming: MeetingRequestEntry[];
  outgoing: MeetingRequestEntry[];
};

function uniqueIds(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function toDateTimeLocalValue(isoDate: string) {
  const date = new Date(isoDate);
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

function formatSlotLabel(isoDate: string) {
  return new Date(isoDate).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatReferenceTime(isoDate: string, timeZone: string | null) {
  const resolvedTimeZone = timeZone || "UTC";
  const parsed = DateTime.fromISO(isoDate).setZone(resolvedTimeZone);
  if (!parsed.isValid) {
    return resolvedTimeZone;
  }

  return `${parsed.toFormat("dd LLL HH:mm")} (${resolvedTimeZone})`;
}

function buildAvailabilityRequest(request: MeetingRequestEntry) {
  return {
    recipientMode: "group" as const,
    attendeeIds: uniqueIds([request.requester.id, ...request.attendees.map((attendee) => attendee.id)]),
    durationMin: request.durationMin,
    organizerTimeZone: request.organizerTimeZone || "UTC",
    rangeStartDate: request.scheduledStartAt ?? request.proposedStartAt,
  };
}

export function MeetingRequestsPanel() {
  const [payload, setPayload] = useState<Payload>({ incoming: [], outgoing: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [scheduleOverrides, setScheduleOverrides] = useState<Record<string, string>>({});
  const [panelError, setPanelError] = useState<string | null>(null);
  const [availabilityByRequestId, setAvailabilityByRequestId] = useState<Record<string, AvailabilityPayload>>({});
  const [loadingAvailabilityByRequestId, setLoadingAvailabilityByRequestId] = useState<Record<string, boolean>>({});
  const [availabilityErrorsByRequestId, setAvailabilityErrorsByRequestId] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const response = await fetch("/api/meetings/requests", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const nextPayload = (await response.json()) as Payload;
    setPayload(nextPayload);
    setScheduleOverrides((current) => {
      const next = { ...current };
      for (const request of nextPayload.incoming) {
        if (!next[request.id]) {
          next[request.id] = toDateTimeLocalValue(request.scheduledStartAt ?? request.proposedStartAt);
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    load().finally(() => setIsLoading(false));

    const refresh = () => {
      void load();
    };

    const timer = setInterval(refresh, 15000);
    const unsubscribe = subscribeMeetingDataChanged(refresh);

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [load]);

  const pendingIncoming = useMemo(
    () => payload.incoming.filter((request) => request.status === "pending"),
    [payload.incoming],
  );

  useEffect(() => {
    for (const request of pendingIncoming) {
      if (availabilityByRequestId[request.id] || loadingAvailabilityByRequestId[request.id]) {
        continue;
      }
      if (availabilityErrorsByRequestId[request.id]) {
        continue;
      }

      setLoadingAvailabilityByRequestId((current) => ({ ...current, [request.id]: true }));

      fetch("/api/meetings/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildAvailabilityRequest(request)),
      })
        .then(async (response) => {
          const nextAvailability = (await response.json().catch(() => ({}))) as AvailabilityPayload & {
            error?: string;
          };
          if (!response.ok) {
            throw new Error(nextAvailability.error || "Unable to load suggested slots.");
          }

          setAvailabilityByRequestId((current) => ({
            ...current,
            [request.id]: nextAvailability,
          }));
        })
        .catch((availabilityError) => {
          setAvailabilityErrorsByRequestId((current) => ({
            ...current,
            [request.id]:
              availabilityError instanceof Error
                ? availabilityError.message
                : "Unable to load suggested slots.",
          }));
        })
        .finally(() => {
          setLoadingAvailabilityByRequestId((current) => ({
            ...current,
            [request.id]: false,
          }));
        });
    }
  }, [availabilityByRequestId, availabilityErrorsByRequestId, loadingAvailabilityByRequestId, pendingIncoming]);

  async function updateRequest(id: string, decision: "accept" | "decline" | "cancel") {
    setPanelError(null);
    setIsUpdatingId(id);

    try {
      const targetRequest =
        payload.incoming.find((request) => request.id === id) ??
        payload.outgoing.find((request) => request.id === id) ??
        null;

      const scheduledStartAt =
        decision === "accept"
          ? new Date(
              scheduleOverrides[id]
                ? scheduleOverrides[id]
                : targetRequest?.scheduledStartAt ?? targetRequest?.proposedStartAt ?? new Date().toISOString(),
            ).toISOString()
          : undefined;

      const response = await fetch(`/api/meetings/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, scheduledStartAt }),
      });

      const nextPayload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setPanelError(nextPayload.error || "Unable to update this meeting request.");
        return;
      }

      emitMeetingDataChanged();
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
    const availability = availabilityByRequestId[request.id];
    const loadingAvailability = loadingAvailabilityByRequestId[request.id];
    const availabilityError = availabilityErrorsByRequestId[request.id];

    return (
      <div
        key={request.id}
        className={`rounded-lg border p-3 ${mode === "incoming" ? "bg-white" : "bg-ivory"} border-ink-border`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">{request.title}</p>
            <p className="text-xs text-ink/60">
              {mode === "incoming"
                ? `From ${request.requester.name}`
                : `To ${attendeeLabel || request.targetLabel || "group"}`}
            </p>
            <p className="mt-1 text-xs text-ink/60">
              {new Date(request.scheduledStartAt ?? request.proposedStartAt).toLocaleString([], {
                dateStyle: "short",
                timeStyle: "short",
              })}{" "}
              · organizer reference {formatReferenceTime(request.scheduledStartAt ?? request.proposedStartAt, request.organizerTimeZone)}
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
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink/55">Choose final time</p>

            {availabilityError ? <p className="text-xs text-alert-red">{availabilityError}</p> : null}
            {loadingAvailability ? (
              <p className="text-xs text-ink/60">Loading suggested slots...</p>
            ) : availability?.suggestedSlots.length ? (
              <div className="grid gap-2">
                {availability.suggestedSlots.slice(0, 4).map((slot) => {
                  const localValue = toDateTimeLocalValue(slot.startsAt);
                  const isSelected = scheduleOverrides[request.id] === localValue;

                  return (
                    <button
                      key={slot.startsAt}
                      type="button"
                      onClick={() =>
                        setScheduleOverrides((current) => ({
                          ...current,
                          [request.id]: localValue,
                        }))
                      }
                      className={`rounded-lg border px-3 py-2 text-left ${
                        isSelected ? "border-ink-blue bg-blue-50" : "border-ink-border bg-ivory"
                      }`}
                    >
                      <p className="text-sm font-semibold text-ink">{formatSlotLabel(slot.startsAt)}</p>
                      <div className="mt-1 space-y-1 text-[11px] text-ink/60">
                        {slot.participantTimes.map((entry) => (
                          <p key={`${slot.startsAt}-${entry.userId}`}>
                            {entry.name}: {entry.localStart} → {entry.localEnd}
                          </p>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}

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
            <p className="text-[11px] text-ink/55">
              Manual override is still available if none of the suggested slots fit.
            </p>

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

      {panelError ? <p className="mt-3 text-sm text-alert-red">{panelError}</p> : null}

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
