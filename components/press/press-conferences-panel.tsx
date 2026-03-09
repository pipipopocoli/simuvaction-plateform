"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mic, Radio, Video } from "lucide-react";
import { Panel, StatusBadge } from "@/components/ui/commons";

type PressConferenceItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  googleMeetUrl: string | null;
  joinPath: string;
  participants: Array<{
    role: string;
    user: {
      id: string;
      name: string;
      role: string;
      displayRole: string | null;
      mediaOutlet: string | null;
    };
  }>;
};

type ContactsPayload = {
  members: Array<{
    id: string;
    name: string;
    role: string;
    teamName: string | null;
  }>;
};

export function PressConferencesPanel() {
  const [conferences, setConferences] = useState<PressConferenceItem[]>([]);
  const [contacts, setContacts] = useState<ContactsPayload>({ members: [] });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledStartAt, setScheduledStartAt] = useState("");
  const [scheduledEndAt, setScheduledEndAt] = useState("");
  const [speakerIds, setSpeakerIds] = useState<string[]>([]);
  const [googleMeetRequested, setGoogleMeetRequested] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [conferenceResponse, contactsResponse] = await Promise.all([
      fetch("/api/press-conferences", { cache: "no-store" }),
      fetch("/api/chat/contacts", { cache: "no-store" }),
    ]);
    if (conferenceResponse.ok) {
      setConferences(await conferenceResponse.json());
    }
    if (contactsResponse.ok) {
      const payload = await contactsResponse.json();
      setContacts({ members: payload.members ?? [] });
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/press-conferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          scheduledStartAt: new Date(scheduledStartAt).toISOString(),
          scheduledEndAt: new Date(scheduledEndAt).toISOString(),
          organizerTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          speakerIds,
          googleMeetRequested,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to create the press conference.");
      }

      setTitle("");
      setDescription("");
      setScheduledStartAt("");
      setScheduledEndAt("");
      setSpeakerIds([]);
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create the press conference.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <Panel>
        <div className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-ink-blue" />
          <h2 className="font-serif text-2xl font-bold text-ink">Plan a press conference</h2>
        </div>
        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
            required
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Scope, speakers, and public angle"
            className="min-h-[120px] w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="datetime-local"
              value={scheduledStartAt}
              onChange={(event) => setScheduledStartAt(event.target.value)}
              className="rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
              required
            />
            <input
              type="datetime-local"
              value={scheduledEndAt}
              onChange={(event) => setScheduledEndAt(event.target.value)}
              className="rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
              required
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Speakers and co-hosts</p>
            <div className="grid max-h-48 gap-2 overflow-y-auto rounded-xl border border-ink-border bg-white p-3">
              {contacts.members.map((member) => (
                <label key={member.id} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={speakerIds.includes(member.id)}
                    onChange={(event) =>
                      setSpeakerIds((current) =>
                        event.target.checked
                          ? [...current, member.id]
                          : current.filter((value) => value !== member.id),
                      )
                    }
                  />
                  <span>
                    {member.name} ({member.teamName ?? member.role})
                  </span>
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink/75">
            <input
              type="checkbox"
              checked={googleMeetRequested}
              onChange={(event) => setGoogleMeetRequested(event.target.checked)}
            />
            Create a Google Meet if the organizer connected Google Calendar
          </label>
          {error ? <p className="text-sm font-semibold text-alert-red">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-ink-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? "Scheduling..." : "Schedule press conference"}
          </button>
        </form>
      </Panel>

      <Panel>
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-alert-red" />
          <h2 className="font-serif text-2xl font-bold text-ink">Upcoming and recent conferences</h2>
        </div>
        <div className="mt-4 space-y-3">
          {conferences.length === 0 ? (
            <p className="text-sm text-ink/60">No press conference scheduled.</p>
          ) : (
            conferences.map((conference) => (
              <div key={conference.id} className="rounded-xl border border-ink-border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-ink">{conference.title}</p>
                    <p className="mt-1 text-sm text-ink/65">
                      {new Date(conference.scheduledStartAt).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    {conference.description ? (
                      <p className="mt-2 text-sm text-ink/75">{conference.description}</p>
                    ) : null}
                  </div>
                  <StatusBadge tone={conference.status === "live" ? "live" : "neutral"}>
                    {conference.status}
                  </StatusBadge>
                </div>
                <div className="mt-3 text-xs text-ink/60">
                  Speakers:{" "}
                  {conference.participants.map((participant) => participant.user.name).join(", ") || "TBA"}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold">
                  <Link href={conference.joinPath} className="inline-flex items-center gap-1 text-ink-blue hover:underline">
                    <Video className="h-4 w-4" />
                    Open video room
                  </Link>
                  {conference.googleMeetUrl ? (
                    <a href={conference.googleMeetUrl} target="_blank" rel="noreferrer" className="text-ink-blue hover:underline">
                      Google Meet
                    </a>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
