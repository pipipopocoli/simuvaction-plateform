"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Plus } from "lucide-react";
import { ActionButton, Panel, TimelineItem } from "@/components/ui/commons";
import { MeetingRequestDialog, type MeetingRequestPreset } from "@/components/meetings/meeting-request-form";
import { isAdminLike } from "@/lib/authz";
import { subscribeMeetingDataChanged } from "@/lib/meeting-client-events";

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

type CalendarEvent = {
  id: string;
  type: "deadline" | "meeting" | "press_conference";
  title: string;
  startsAt: string;
  details: string;
  deepLink: string | null;
};

export function QuickActionsPanel({ role }: { role: string }) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [agenda, setAgenda] = useState<CalendarEvent[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [meetingTargetType, setMeetingTargetType] = useState<"member" | "team">("member");
  const [mode, setMode] = useState<"none" | "message" | "meeting">("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [meetingDialogPreset, setMeetingDialogPreset] = useState<MeetingRequestPreset | undefined>();

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedMemberId) ?? null,
    [contacts, selectedMemberId],
  );
  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) ?? null,
    [selectedTeamId, teams],
  );

  const loadAgenda = useCallback(async () => {
    const calendarResponse = await fetch("/api/calendar/events", { cache: "no-store" });
    if (calendarResponse.ok) {
      const payload = (await calendarResponse.json()) as { events: CalendarEvent[] };
      setAgenda(payload.events.slice(0, 4));
    }
  }, []);

  const loadContacts = useCallback(async () => {
    const contactsResponse = await fetch("/api/chat/contacts", { cache: "no-store" });
    if (!contactsResponse.ok) {
      return;
    }

    const payload = (await contactsResponse.json()) as {
      members: Contact[];
      teams: TeamOption[];
    };
    setContacts(payload.members);
    setTeams(payload.teams);
  }, []);

  useEffect(() => {
    void loadContacts();
    void loadAgenda();

    const refresh = () => {
      void loadAgenda();
    };

    const timer = setInterval(refresh, 15000);
    const unsubscribe = subscribeMeetingDataChanged(refresh);

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [loadAgenda, loadContacts]);

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

  function openMeetingDialog() {
    if (meetingTargetType === "member" && !selectedContact) {
      setError("Select a member before opening the scheduler.");
      return;
    }

    if (meetingTargetType === "team" && !selectedTeam) {
      setError("Select a delegation before opening the scheduler.");
      return;
    }

    const preset: MeetingRequestPreset =
      meetingTargetType === "team"
        ? {
            recipientMode: "team",
            targetTeamId: selectedTeam?.id,
            title: `Meeting request: ${selectedTeam?.name ?? "Delegation"}`,
            note: "Request prepared from Quick Actions.",
          }
        : {
            recipientMode: "individual",
            targetUserId: selectedContact?.id,
            title:
              selectedContact?.teamName
                ? `Meeting request: ${selectedContact.teamName}`
                : `Meeting request: ${selectedContact?.name ?? "Participant"}`,
            note: "Request prepared from Quick Actions.",
          };

    setError(null);
    setMeetingDialogPreset(preset);
    setIsMeetingDialogOpen(true);
  }

  function handleMeetingDialogSuccess() {
    setMode("none");
    setSelectedMemberId("");
    setSelectedTeamId("");
    void loadAgenda();
  }

  return (
    <>
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
            <ActionButton
              variant="secondary"
              className="w-full justify-between"
              onClick={() => router.push("/newsroom")}
            >
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

          <ActionButton
            variant="ghost"
            className="w-full justify-between"
            onClick={() => router.push("/press-conferences")}
          >
            Press Conferences
            <ChevronRight className="h-4 w-4" />
          </ActionButton>
        </div>

        {mode !== "none" ? (
          <div className="mt-4 space-y-3 rounded-lg border border-ink-border bg-ivory p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">
              {mode === "message" ? "Open direct thread" : "Launch meeting scheduler"}
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

                <p className="text-xs text-ink/60">
                  The shared scheduler opens next with timezone-aware suggestions and the same
                  validation used across the platform.
                </p>
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
                  (mode === "message"
                    ? !selectedMemberId
                    : meetingTargetType === "member"
                      ? !selectedMemberId
                      : !selectedTeamId)
                }
                onClick={mode === "message" ? openMessage : openMeetingDialog}
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
                  "Open scheduler"
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

      <MeetingRequestDialog
        isOpen={isMeetingDialogOpen}
        onClose={() => setIsMeetingDialogOpen(false)}
        preset={meetingDialogPreset}
        onSuccess={handleMeetingDialogSuccess}
      />
    </>
  );
}
