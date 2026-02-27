"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Panel, StatusBadge } from "@/components/ui/commons";

type MeetingRequestEntry = {
  id: string;
  title: string;
  note: string | null;
  status: string;
  proposedStartAt: string;
  scheduledStartAt: string | null;
  requester: { id: string; name: string; role: string };
  targetUser: { id: string; name: string; role: string };
  chatRoom: { id: string; name: string } | null;
};

type Payload = {
  incoming: MeetingRequestEntry[];
  outgoing: MeetingRequestEntry[];
};

export function MeetingRequestsPanel() {
  const [payload, setPayload] = useState<Payload>({ incoming: [], outgoing: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

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
      await fetch(`/api/meetings/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      await load();
    } finally {
      setIsUpdatingId(null);
    }
  }

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-2xl font-bold text-ink">Meeting Requests</h3>
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
                payload.incoming.map((request) => (
                  <div key={request.id} className="rounded-lg border border-ink-border bg-white p-3">
                    <p className="text-sm font-semibold text-ink">{request.title}</p>
                    <p className="text-xs text-ink/60">From {request.requester.name}</p>
                    <p className="text-xs text-ink/60">
                      {new Date(request.proposedStartAt).toLocaleString([], {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                    {request.note ? <p className="mt-1 text-xs text-ink/70">{request.note}</p> : null}

                    {request.status === "pending" ? (
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => updateRequest(request.id, "accept")}
                          disabled={isUpdatingId === request.id}
                          className="rounded bg-ink-blue px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          {isUpdatingId === request.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Accept"}
                        </button>
                        <button
                          onClick={() => updateRequest(request.id, "decline")}
                          disabled={isUpdatingId === request.id}
                          className="rounded border border-ink-border bg-white px-2.5 py-1 text-xs font-semibold text-ink disabled:opacity-60"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <StatusBadge tone={request.status === "accepted" ? "live" : "neutral"}>{request.status}</StatusBadge>
                        {request.chatRoom ? (
                          <Link href={`/chat/${request.chatRoom.id}`} className="text-xs font-semibold text-ink-blue hover:underline">
                            Open room
                          </Link>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Outgoing</p>
            <div className="mt-2 space-y-2">
              {payload.outgoing.length === 0 ? (
                <p className="text-sm text-ink/60">No outgoing request.</p>
              ) : (
                payload.outgoing.map((request) => (
                  <div key={request.id} className="rounded-lg border border-ink-border bg-ivory p-3">
                    <p className="text-sm font-semibold text-ink">{request.title}</p>
                    <p className="text-xs text-ink/60">To {request.targetUser.name}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusBadge tone={request.status === "pending" ? "alert" : "neutral"}>{request.status}</StatusBadge>
                      {request.status === "pending" ? (
                        <button
                          onClick={() => updateRequest(request.id, "cancel")}
                          disabled={isUpdatingId === request.id}
                          className="rounded border border-ink-border bg-white px-2.5 py-1 text-xs font-semibold text-ink disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      ) : null}
                      {request.chatRoom ? (
                        <Link href={`/chat/${request.chatRoom.id}`} className="text-xs font-semibold text-ink-blue hover:underline">
                          Open room
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}
