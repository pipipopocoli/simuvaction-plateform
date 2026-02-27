"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Loader2, MessageSquare, Users, X } from "lucide-react";
import type { AtlasDelegation } from "@/lib/atlas";
import { ClickableWorldMap } from "@/components/atlas/clickable-world-map";

type ChatContact = {
  id: string;
  name: string;
  role: string;
  teamId: string | null;
};

type InteractiveGlobalMapProps = {
  delegations: AtlasDelegation[];
  selectedDelegationId: string | null;
  onSelectDelegation: (delegationId: string | null) => void;
};

export function InteractiveGlobalMap({
  delegations,
  selectedDelegationId,
  onSelectDelegation,
}: InteractiveGlobalMapProps) {
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isRequestingMeeting, setIsRequestingMeeting] = useState(false);
  const [isOpeningThread, setIsOpeningThread] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedDelegation = useMemo(() => {
    if (!selectedDelegationId) {
      return null;
    }

    return delegations.find((delegation) => delegation.id === selectedDelegationId) ?? null;
  }, [delegations, selectedDelegationId]);

  const selectedMembers = useMemo(() => {
    const previews = selectedDelegation?.memberPreviews ?? [];
    const filled = previews.slice(0, 2);

    while (filled.length < 2) {
      filled.push({
        id: `placeholder-${filled.length}`,
        name: `Delegate ${filled.length + 1}`,
        role: "delegate",
        displayRole: "Representative",
        mediaOutlet: "Independent",
        avatarUrl: null,
        positionPaperSummary: null,
      });
    }

    return filled;
  }, [selectedDelegation]);

  useEffect(() => {
    if (!selectedDelegationId) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedDelegationId]);

  useEffect(() => {
    if (!selectedDelegation) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onSelectDelegation(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onSelectDelegation, selectedDelegation]);

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
    <div className="relative isolate w-full rounded-2xl border border-ink-border bg-slate-100">
      <div className="relative h-[clamp(520px,68vh,860px)] overflow-hidden rounded-2xl p-1">
        <ClickableWorldMap
          delegations={delegations}
          selectedDelegationId={selectedDelegationId}
          onSelectDelegation={onSelectDelegation}
        />
      </div>

      {selectedDelegation ? (
        <div className="absolute inset-0 z-[80] pointer-events-none">
          <button
            type="button"
            onClick={() => onSelectDelegation(null)}
            className="absolute inset-0 bg-transparent md:hidden pointer-events-auto"
            aria-label="Close delegation card"
          />

          <div className="pointer-events-auto absolute left-1/2 top-1/2 z-[90] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-ink-border bg-white/95 p-4 shadow-2xl backdrop-blur-sm md:left-auto md:right-3 md:top-3 md:w-full md:max-w-sm md:translate-x-0 md:translate-y-0">
          <button
            ref={closeButtonRef}
            onClick={() => onSelectDelegation(null)}
            className="absolute right-2 top-2 rounded-md p-1 text-ink/50 hover:bg-ink/5 hover:text-ink"
            aria-label="Close delegation card"
          >
            <X className="h-4 w-4" />
          </button>

          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Delegation</p>
          <h3 className="mt-1 flex items-center gap-2 font-serif text-2xl font-bold text-ink">
            <span className="text-2xl leading-none">{selectedDelegation.flagEmoji}</span>
            {selectedDelegation.name}
          </h3>
          <p className="mt-1 text-xs uppercase tracking-[0.08em] text-ink/55">
            {selectedDelegation.region} • {selectedDelegation.kind}
          </p>

          <div className="mt-3 flex items-center gap-2">
            {selectedMembers.map((member) => (
              <div key={member.id} className="relative">
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="h-8 w-8 rounded-full border border-ink-border object-cover"
                  />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-ink-border bg-ivory text-[10px] font-bold text-ink/70">
                    {member.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
            ))}
          </div>

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

          <div className="mt-3 rounded-lg border border-ink-border bg-ivory/70 p-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink/55">Recent actions</p>
            <ul className="mt-1 space-y-1 text-xs text-ink/75">
              {selectedDelegation.latestActions.slice(0, 2).map((action) => (
                <li key={action}>• {action}</li>
              ))}
            </ul>
          </div>

          <div className="mt-3 grid gap-2">
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
        </div>
      ) : null}

      {!selectedDelegation ? (
        <div className="pointer-events-none absolute bottom-3 left-3 z-20 max-w-xs rounded-lg border border-ink-border bg-white/90 p-3 shadow-sm backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 shrink-0 text-ink-blue" />
            <p className="text-[11px] leading-relaxed text-ink/70">
              Click a green country to open its delegation card with flag, delegates, stance, and actions.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
