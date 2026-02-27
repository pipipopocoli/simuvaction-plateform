"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Loader2, MessageSquare, Users } from "lucide-react";
import type { AtlasDelegation } from "@/lib/atlas";

type ChatContact = {
  id: string;
  name: string;
  role: string;
  teamId: string | null;
};

export function InteractiveGlobalMap({ delegations }: { delegations: AtlasDelegation[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(delegations[0]?.id ?? "");
  const [isRequestingMeeting, setIsRequestingMeeting] = useState(false);
  const [isOpeningThread, setIsOpeningThread] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedDelegation = useMemo(
    () => delegations.find((delegation) => delegation.id === selectedId) ?? delegations[0] ?? null,
    [delegations, selectedId],
  );

  const countryPins = useMemo(
    () => delegations.filter((delegation) => delegation.kind === "country" && delegation.mapPoint),
    [delegations],
  );

  async function findTeamContact(teamId: string) {
    const response = await fetch("/api/chat/contacts", { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const contacts = (await response.json()) as ChatContact[];
    return contacts.find((contact) => contact.teamId === teamId) ?? null;
  }

  async function openDelegationThread() {
    if (!selectedDelegation) {
      return;
    }

    setFeedback(null);
    setIsOpeningThread(true);

    try {
      const contact = await findTeamContact(selectedDelegation.id);
      if (!contact) {
        setFeedback("No contact available in this delegation yet.");
        return;
      }

      const response = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomType: "direct",
          targetUserId: contact.id,
        }),
      });

      if (!response.ok) {
        setFeedback("Unable to open direct thread.");
        return;
      }

      const room = (await response.json()) as { id: string };
      router.push(`/chat/${room.id}`);
    } finally {
      setIsOpeningThread(false);
    }
  }

  async function requestMeeting() {
    if (!selectedDelegation) {
      return;
    }

    setFeedback(null);
    setIsRequestingMeeting(true);

    try {
      const contact = await findTeamContact(selectedDelegation.id);
      if (!contact) {
        setFeedback("No contact available in this delegation yet.");
        return;
      }

      const proposedStartAt = new Date(Date.now() + 1000 * 60 * 60).toISOString();

      const response = await fetch("/api/meetings/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: contact.id,
          targetTeamId: selectedDelegation.id,
          title: `Bilateral with ${selectedDelegation.name}`,
          note: "Request created from Global Activity Map.",
          proposedStartAt,
          durationMin: 30,
        }),
      });

      if (!response.ok) {
        setFeedback("Unable to send meeting request.");
        return;
      }

      setFeedback("Meeting request sent.");
    } finally {
      setIsRequestingMeeting(false);
    }
  }

  return (
    <div className="relative h-[430px] w-full overflow-hidden rounded-2xl border border-ink-border bg-slate-100">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-80 pointer-events-none"
        style={{
          backgroundImage:
            "url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#f9fbff]/65 via-white/40 to-[#f8f3ec]/65 pointer-events-none" />

      {countryPins.map((delegation) => {
        const selected = selectedDelegation?.id === delegation.id;
        return (
          <button
            key={delegation.id}
            onClick={() => setSelectedId(delegation.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${delegation.mapPoint?.xPct}%`, top: `${delegation.mapPoint?.yPct}%` }}
            title={delegation.name}
          >
            <span className="relative flex h-5 w-5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${
                  selected ? "animate-ping bg-ink-blue/75" : "bg-emerald-500/45"
                }`}
              />
              <span
                className={`relative inline-flex h-5 w-5 rounded-full border-2 border-white ${
                  selected ? "bg-ink-blue" : "bg-emerald-500"
                }`}
              />
            </span>
          </button>
        );
      })}

      {selectedDelegation ? (
        <div className="absolute bottom-4 right-4 z-30 w-full max-w-sm rounded-xl border border-ink-border bg-white/95 p-4 shadow-xl backdrop-blur-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Delegation</p>
          <h3 className="mt-1 font-serif text-2xl font-bold text-ink">{selectedDelegation.name}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.08em] text-ink/55">
            {selectedDelegation.region} • {selectedDelegation.kind}
          </p>

          <p className="mt-3 text-sm text-ink/80">{selectedDelegation.stance}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {selectedDelegation.priorities.map((priority) => (
              <span
                key={priority}
                className="rounded-md border border-ink-border bg-ivory px-2 py-1 text-[11px] text-ink/75"
              >
                {priority}
              </span>
            ))}
          </div>

          <div className="mt-4 grid gap-2">
            <button
              onClick={requestMeeting}
              disabled={isRequestingMeeting}
              className="inline-flex items-center justify-between rounded-lg border border-ink-blue/30 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-ink-blue hover:bg-blue-50 disabled:opacity-60"
            >
              Request meeting
              {isRequestingMeeting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={openDelegationThread}
              disabled={isOpeningThread}
              className="inline-flex items-center justify-between rounded-lg border border-ink-border bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-ink hover:bg-ivory disabled:opacity-60"
            >
              Open delegation thread
              {isOpeningThread ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
            </button>
          </div>

          {feedback ? <p className="mt-2 text-xs text-ink/65">{feedback}</p> : null}
        </div>
      ) : null}

      {!selectedDelegation ? (
        <div className="absolute bottom-4 left-4 max-w-xs rounded-lg border border-ink-border bg-white/90 p-3 shadow-sm backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 shrink-0 text-ink-blue" />
            <p className="text-[11px] leading-relaxed text-ink/70">
              Click a delegation pin to view stance, priorities, and launch direct diplomatic actions.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
