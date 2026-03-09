"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Plus, Sparkles } from "lucide-react";
import { ActionButton, Panel, TimelineItem } from "@/components/ui/commons";
import { isAdminLike } from "@/lib/authz";

type Contact = {
  id: string;
  name: string;
  role: string;
  teamId: string | null;
  teamName: string | null;
  preferredTimeZone: string;
};

type TeamOption = {
  id: string;
  name: string;
  memberCount: number;
  preferredTimeZone: string;
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

type CalendarEvent = {
  id: string;
  type: "deadline" | "meeting" | "press_conference";
  title: string;
  startsAt: string;
  details: string;
  deepLink: string | null;
};

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

export function QuickActionsPanel({ role }: { role: string }) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [agenda, setAgenda] = useState<CalendarEvent[]>([]);
  const [organizerTimeZone, setOrganizerTimeZone] = useState("UTC");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [meetingNote, setMeetingNote] = useState("");
  const [meetingDateTime, setMeetingDateTime] = useState("");
  const [meetingDuration, setMeetingDuration] = useState("30");
  const [meetingTargetType, setMeetingTargetType] = useState<"member" | "team">("member");
  const [mode, setMode] = useState<"none" | "message" | "meeting">("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityPayload>({
    organizerTimeZone: "UTC",
    participants: [],
    suggestedSlots: [],
  });
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  async function loadAgenda() {
    const calendarResponse = await fetch("/api/calendar/events", { cache: "no-store" });
    if (calendarResponse.ok) {
      const payload = (await calendarResponse.json()) as { events: CalendarEvent[] };
      setAgenda(payload.events.slice(0, 4));
    }
  }

  useEffect(() => {
    async function load() {
      const [contactsResponse] = await Promise.all([
        fetch("/api/chat/contacts", { cache: "no-store" }),
        loadAgenda(),
      ]);

      if (contactsResponse.ok) {
        const payload = (await contactsResponse.json()) as {
          members: Contact[];
          teams: TeamOption[];
          currentUserTimeZone: string;
        };
        setContacts(payload.members);
        setTeams(payload.teams);
        setOrganizerTimeZone(payload.currentUserTimeZone || "UTC");
      }
    }

    void load();
  }, []);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedMemberId) ?? null,
    [contacts, selectedMemberId],
  );
  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) ?? null,
    [selectedTeamId, teams],
  );
  const meetingDurationMin = useMemo(() => {
    const parsed = Number.parseInt(meetingDuration, 10);
    return Number.isFinite(parsed) ? parsed : 30;
  }, [meetingDuration]);
  const browserTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || organizerTimeZone || "UTC",
    [organizerTimeZone],
  );

  const availabilityRequest = useMemo(() => {
    if (mode !== "meeting" || meetingDurationMin < 10 || meetingDurationMin > 240) {
      return null;
    }

    if (meetingTargetType === "member" && !selectedMemberId) {
      return null;
    }

    if (meetingTargetType === "team" && !selectedTeamId) {
      return null;
    }

    return {
      recipientMode: meetingTargetType === "member" ? "individual" : "team",
      targetUserId: meetingTargetType === "member" ? selectedMemberId : undefined,
      targetTeamId: meetingTargetType === "team" ? selectedTeamId : undefined,
      durationMin: meetingDurationMin,
      organizerTimeZone: browserTimeZone,
      rangeDays: 7,
    };
  }, [browserTimeZone, meetingDurationMin, meetingTargetType, mode, selectedMemberId, selectedTeamId]);

  useEffect(() => {
    if (!availabilityRequest) {
      setAvailability({
        organizerTimeZone: browserTimeZone,
        participants: [],
        suggestedSlots: [],
      });
      setAvailabilityError(null);
      setIsLoadingAvailability(false);
      return;
    }

    let active = true;
    setIsLoadingAvailability(true);
    setAvailabilityError(null);

    fetch("/api/meetings/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(availabilityRequest),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as AvailabilityPayload & { error?: string };
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load suggested meeting slots.");
        }
        if (active) {
          setAvailability(payload);
        }
      })
      .catch((availabilityLoadError) => {
        if (active) {
          setAvailability({
            organizerTimeZone: browserTimeZone,
            participants: [],
            suggestedSlots: [],
          });
          setAvailabilityError(
            availabilityLoadError instanceof Error
              ? availabilityLoadError.message
              : "Unable to load suggested meeting slots.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingAvailability(false);
        }
      });

    return () => {
      active = false;
    };
  }, [availabilityRequest, browserTimeZone]);

  async function openMessage() {
    if (!selectedMemberId) {
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
          targetUserId: selectedMemberId,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!response.ok || !payload.id) {
        setError(payload.error || "Unable to open direct thread.");
        return;
      }

      setMode("none");
      router.push(`/chat/${payload.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestMeeting() {
    if (!meetingDateTime) {
      return;
    }

    if (meetingTargetType === "member" && !selectedMemberId) {
      return;
    }

    if (meetingTargetType === "team" && !selectedTeamId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/meetings/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientMode: meetingTargetType === "member" ? "individual" : "team",
          targetUserId: meetingTargetType === "member" ? selectedMemberId : undefined,
          targetTeamId: meetingTargetType === "team" ? selectedTeamId : undefined,
          title:
            meetingTargetType === "team"
              ? `Meeting request: ${selectedTeam?.name ?? "Delegation"}`
              : selectedContact?.teamName
                ? `Meeting request: ${selectedContact.teamName}`
                : `Meeting request: ${selectedContact?.name ?? "Participant"}`,
          note: meetingNote || undefined,
          proposedStartAt: new Date(meetingDateTime).toISOString(),
          durationMin: meetingDurationMin,
          organizerTimeZone: browserTimeZone,
          googleMeetRequested: true,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(payload.error || "Unable to send meeting request.");
        return;
      }

      setMode("none");
      setMeetingNote("");
      setMeetingDateTime("");
      setMeetingDuration("30");
      setSelectedTeamId("");
      await loadAgenda();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Panel className="xl:col-span-3">
      <h2 className="font-serif text-3xl font-bold text-ink">Quick Actions</h2>

      <div className="mt-4 space-y-3">
        {(role === "leader" || isAdminLike(role)) && (
          <ActionButton className="w-full justify-between" onClick={() => router.push("/votes")}>
            Create Vote
            <ChevronRight className="h-4 w-4" />
          </ActionButton>
        )}

        {(role === "journalist" || isAdminLike(role)) && (
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

        <ActionButton variant="ghost" className="w-full justify-between" onClick={() => router.push("/press-conferences")}>
          Press Conferences
          <ChevronRight className="h-4 w-4" />
        </ActionButton>
      </div>

      {mode !== "none" ? (
        <div className="mt-4 space-y-3 rounded-lg border border-ink-border bg-ivory p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">
            {mode === "message" ? "Open direct thread" : "New meeting request"}
          </p>

          {mode === "message" ? (
            <select
              value={selectedMemberId}
              onChange={(event) => setSelectedMemberId(event.target.value)}
              className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
            >
              <option value="">Select a member</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} ({contact.teamName ?? contact.role}) · {contact.preferredTimeZone}
                </option>
              ))}
            </select>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["member", "team"] as const).map((targetType) => (
                  <button
                    key={targetType}
                    type="button"
                    onClick={() => setMeetingTargetType(targetType)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold ${
                      meetingTargetType === targetType
                        ? "border-ink-blue bg-blue-50 text-ink-blue"
                        : "border-ink-border bg-white text-ink"
                    }`}
                  >
                    {targetType === "member" ? "Individual member" : "Delegation team"}
                  </button>
                ))}
              </div>

              {meetingTargetType === "member" ? (
                <select
                  value={selectedMemberId}
                  onChange={(event) => setSelectedMemberId(event.target.value)}
                  className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
                >
                  <option value="">Select a member</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} ({contact.teamName ?? contact.role}) · {contact.preferredTimeZone}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedTeamId}
                  onChange={(event) => setSelectedTeamId(event.target.value)}
                  className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
                >
                  <option value="">Select a delegation</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} · {team.memberCount} members · {team.preferredTimeZone}
                    </option>
                  ))}
                </select>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">
                    Duration
                  </span>
                  <input
                    type="number"
                    min={10}
                    max={240}
                    value={meetingDuration}
                    onChange={(event) => setMeetingDuration(event.target.value)}
                    className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">
                    Proposed time
                  </span>
                  <input
                    type="datetime-local"
                    value={meetingDateTime}
                    onChange={(event) => setMeetingDateTime(event.target.value)}
                    className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
                  />
                </label>
              </div>

              <div className="rounded-lg border border-ink-border bg-white p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-ink-blue" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Suggested slots</p>
                </div>
                {availabilityError ? <p className="mt-2 text-xs text-alert-red">{availabilityError}</p> : null}
                {isLoadingAvailability ? (
                  <p className="mt-2 text-xs text-ink/60">Loading common availability...</p>
                ) : availability.suggestedSlots.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {availability.suggestedSlots.slice(0, 8).map((slot) => {
                      const localValue = toDateTimeLocalValue(slot.startsAt);
                      const isSelected = localValue === meetingDateTime;

                      return (
                        <button
                          key={slot.startsAt}
                          type="button"
                          onClick={() => setMeetingDateTime(localValue)}
                          className={`w-full rounded-lg border px-3 py-2 text-left ${
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
                ) : availabilityRequest ? (
                  <p className="mt-2 text-xs text-ink/60">
                    No common slot found in the next 7 days. You can still enter a manual time.
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-ink/60">Select a meeting target to generate suggestions.</p>
                )}
              </div>

              <textarea
                value={meetingNote}
                onChange={(event) => setMeetingNote(event.target.value)}
                placeholder="Meeting note (optional)"
                className="min-h-[90px] w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
              />
            </>
          )}

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
              disabled={
                isSubmitting ||
                (mode === "message" ? !selectedMemberId : !meetingDateTime || (meetingTargetType === "member" ? !selectedMemberId : !selectedTeamId))
              }
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
              tone={event.type === "meeting" ? "accent" : event.type === "press_conference" ? "default" : "alert"}
            />
          ))
        )}
      </div>
    </Panel>
  );
}
