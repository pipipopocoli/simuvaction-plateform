"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";

type MeetingHistoryPayload = {
  meetings: Array<{
    id: string;
    title: string;
    status: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    organizer: { id: string; name: string; role: string };
    googleMeetUrl: string | null;
    chatRoom: { id: string; name: string; roomType: string } | null;
    participants: Array<{ id: string; name: string; role: string; sessionRole: string }>;
  }>;
  pressConferences: Array<{
    id: string;
    title: string;
    status: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    createdBy: { id: string; name: string; role: string };
    googleMeetUrl: string | null;
    speakers: Array<{ id: string; name: string; role: string; sessionRole: string }>;
  }>;
};

function formatDate(iso: string) {
  return DateTime.fromISO(iso).toFormat("dd LLL yyyy, HH:mm");
}

export function MeetingHistoryPanel() {
  const [payload, setPayload] = useState<MeetingHistoryPayload>({ meetings: [], pressConferences: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/meetings/history", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      setPayload(await response.json());
      setIsLoading(false);
    }

    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return <p className="text-sm text-ink/60">Loading meetings history...</p>;
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="font-serif text-2xl font-bold text-ink">Meeting sessions</h3>
        <div className="mt-3 space-y-3">
          {payload.meetings.length === 0 ? (
            <p className="text-sm text-ink/60">No meeting session has been recorded yet.</p>
          ) : (
            payload.meetings.map((meeting) => (
              <div key={meeting.id} className="rounded-xl border border-ink-border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{meeting.title}</p>
                    <p className="text-sm text-ink/65">
                      {formatDate(meeting.scheduledStartAt)} to {formatDate(meeting.scheduledEndAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-ivory px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink/60">
                    {meeting.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink/70">
                  Organizer: {meeting.organizer.name} · Participants: {meeting.participants.map((participant) => participant.name).join(", ")}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h3 className="font-serif text-2xl font-bold text-ink">Press conferences</h3>
        <div className="mt-3 space-y-3">
          {payload.pressConferences.length === 0 ? (
            <p className="text-sm text-ink/60">No press conference has been recorded yet.</p>
          ) : (
            payload.pressConferences.map((conference) => (
              <div key={conference.id} className="rounded-xl border border-ink-border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{conference.title}</p>
                    <p className="text-sm text-ink/65">
                      {formatDate(conference.scheduledStartAt)} to {formatDate(conference.scheduledEndAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-ivory px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink/60">
                    {conference.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink/70">
                  Host: {conference.createdBy.name} · Speakers: {conference.speakers.map((speaker) => speaker.name).join(", ")}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
