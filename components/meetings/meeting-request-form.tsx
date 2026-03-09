"use client";

import { useEffect, useMemo, useState } from "react";
import { AlignLeft, CalendarClock, Clock, Send, Users } from "lucide-react";
import { Panel } from "@/components/ui/commons";

type ContactsPayload = {
  currentUserTimeZone: string;
  members: Array<{
    id: string;
    name: string;
    role: string;
    teamId: string | null;
    teamName: string | null;
    preferredTimeZone: string;
  }>;
  teams: Array<{
    id: string;
    name: string;
    memberCount: number;
    preferredTimeZone: string;
  }>;
};

export function MeetingRequestForm({ onSuccess }: { onSuccess?: () => void }) {
  const [contacts, setContacts] = useState<ContactsPayload>({
    currentUserTimeZone: "UTC",
    members: [],
    teams: [],
  });
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [recipientMode, setRecipientMode] = useState<"individual" | "team" | "group">("individual");
  const [targetUserId, setTargetUserId] = useState("");
  const [targetTeamId, setTargetTeamId] = useState("");
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [googleMeetRequested, setGoogleMeetRequested] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/chat/contacts")
      .then((response) => response.json())
      .then((data) => {
        setContacts(data);
      })
      .finally(() => setLoadingContacts(false));
  }, []);

  const selectedAttendees = useMemo(() => {
    if (recipientMode === "individual") {
      return contacts.members.filter((member) => member.id === targetUserId);
    }
    if (recipientMode === "team") {
      return contacts.teams.filter((team) => team.id === targetTeamId);
    }
    return contacts.members.filter((member) => attendeeIds.includes(member.id));
  }, [attendeeIds, contacts.members, contacts.teams, recipientMode, targetTeamId, targetUserId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (!title || !dateTime) {
      setError("Please fill in all required fields.");
      return;
    }

    if (recipientMode === "individual" && !targetUserId) {
      setError("Please select a member.");
      return;
    }

    if (recipientMode === "team" && !targetTeamId) {
      setError("Please select a delegation.");
      return;
    }

    if (recipientMode === "group" && attendeeIds.length === 0) {
      setError("Please select at least one attendee.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/meetings/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientMode,
          targetUserId: recipientMode === "individual" ? targetUserId : undefined,
          targetTeamId: recipientMode === "team" ? targetTeamId : undefined,
          attendeeIds: recipientMode === "group" ? attendeeIds : [],
          title,
          note: note || undefined,
          proposedStartAt: new Date(dateTime).toISOString(),
          durationMin: parseInt(duration, 10),
          organizerTimeZone:
            Intl.DateTimeFormat().resolvedOptions().timeZone || contacts.currentUserTimeZone || "UTC",
          googleMeetRequested,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to send request.");
      }

      setSuccess(true);
      setTargetUserId("");
      setTargetTeamId("");
      setAttendeeIds([]);
      setTitle("");
      setNote("");
      setDateTime("");
      if (onSuccess) onSuccess();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to send request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Panel>
      <div className="mb-4 text-center sm:text-left">
        <h3 className="font-serif text-xl font-bold text-ink">Schedule a meeting</h3>
        <p className="text-sm text-ink/60">Invite one member, an entire delegation, or a private group.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <p className="text-sm font-semibold text-alert-red">{error}</p> : null}
        {success ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm font-semibold text-emerald-700">
            Meeting request sent successfully.
          </p>
        ) : null}

        <div className="grid gap-2 md:grid-cols-3">
          {(["individual", "team", "group"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setRecipientMode(mode)}
              className={`rounded-xl border px-3 py-2 text-left ${
                recipientMode === mode ? "border-ink-blue bg-blue-50" : "border-ink-border bg-white"
              }`}
            >
              <p className="font-semibold capitalize text-ink">{mode}</p>
            </button>
          ))}
        </div>

        {recipientMode === "individual" ? (
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-sm font-bold text-ink/70">
              <Users className="h-4 w-4" /> Target member
            </span>
            <select
              value={targetUserId}
              onChange={(event) => setTargetUserId(event.target.value)}
              disabled={loadingContacts}
              className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-ink shadow-sm outline-none focus:border-ink-blue"
            >
              <option value="">
                {loadingContacts ? "Loading directory..." : "Select a member"}
              </option>
              {contacts.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.teamName ?? member.role}) · {member.preferredTimeZone}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {recipientMode === "team" ? (
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-sm font-bold text-ink/70">
              <Users className="h-4 w-4" /> Target delegation
            </span>
            <select
              value={targetTeamId}
              onChange={(event) => setTargetTeamId(event.target.value)}
              disabled={loadingContacts}
              className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-ink shadow-sm outline-none focus:border-ink-blue"
            >
              <option value="">Select a delegation</option>
              {contacts.teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} · {team.memberCount} members · {team.preferredTimeZone}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {recipientMode === "group" ? (
          <div>
            <span className="mb-2 flex items-center gap-1 text-sm font-bold text-ink/70">
              <Users className="h-4 w-4" /> Private group attendees
            </span>
            <div className="grid max-h-48 gap-2 overflow-y-auto rounded-xl border border-ink-border bg-white p-3">
              {contacts.members.map((member) => (
                <label key={member.id} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={attendeeIds.includes(member.id)}
                    onChange={(event) =>
                      setAttendeeIds((current) =>
                        event.target.checked
                          ? [...current, member.id]
                          : current.filter((value) => value !== member.id),
                      )
                    }
                  />
                  <span>
                    {member.name} ({member.teamName ?? member.role}) · {member.preferredTimeZone}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <label className="block">
          <span className="mb-1 block text-sm font-bold text-ink/70">Subject / Agenda</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-ink shadow-sm outline-none focus:border-ink-blue"
            placeholder="e.g. Education safeguards working session"
            required
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-sm font-bold text-ink/70">
              <CalendarClock className="h-4 w-4" /> Proposed time
            </span>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(event) => setDateTime(event.target.value)}
              className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-ink shadow-sm outline-none focus:border-ink-blue"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-sm font-bold text-ink/70">
              <Clock className="h-4 w-4" /> Duration (minutes)
            </span>
            <input
              type="number"
              value={duration}
              min={10}
              max={240}
              onChange={(event) => setDuration(event.target.value)}
              className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-ink shadow-sm outline-none focus:border-ink-blue"
            />
          </label>
        </div>

        {selectedAttendees.length > 0 ? (
          <div className="rounded-xl border border-ink-border bg-ivory p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Timezone preview</p>
            <div className="mt-2 space-y-1 text-sm text-ink/80">
              {selectedAttendees.map((attendee) => (
                <p key={attendee.id}>
                  {attendee.name} · {attendee.preferredTimeZone}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        <label className="block">
          <span className="mb-1 flex items-center gap-1 text-sm font-bold text-ink/70">
            <AlignLeft className="h-4 w-4" /> Note
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="w-full resize-none rounded-lg border border-ink-border bg-white px-3 py-2 text-ink shadow-sm outline-none focus:border-ink-blue"
            placeholder="Briefly describe the objective of this meeting..."
            rows={3}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-ink/75">
          <input
            type="checkbox"
            checked={googleMeetRequested}
            onChange={(event) => setGoogleMeetRequested(event.target.checked)}
          />
          Request Google Meet when the organizer has connected Google Calendar
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-blue px-4 py-2.5 font-bold text-white shadow-md transition hover:bg-ink-blue/90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "Sending..." : "Send request"}
        </button>
      </form>
    </Panel>
  );
}
