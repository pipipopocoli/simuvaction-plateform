"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Globe2, Lock, Unlock, Users } from "lucide-react";
import { StatusBadge } from "@/components/ui/commons";

type VoteOption = { id: string; label: string };

type VoteRecord = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  visibility: "public" | "secret";
  ballotMode: "per_delegation" | "per_person";
  options: VoteOption[];
  isEligible: boolean;
  hasVoted: boolean;
  _count: { ballots: number };
};

export function VoteDashboard({ currentUserId, currentUserRole }: { currentUserId: string; currentUserRole: string }) {
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [castingId, setCastingId] = useState<string | null>(null);

  async function fetchVotes() {
    try {
      const response = await fetch("/api/votes");
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as VoteRecord[];
      setVotes(data);
    } catch (error) {
      console.error("Failed to fetch votes:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVotes();
    const interval = setInterval(fetchVotes, 10000);
    return () => clearInterval(interval);
  }, []);

  async function castVote(voteId: string, optionId: string) {
    setCastingId(voteId);

    try {
      const response = await fetch(`/api/votes/${voteId}/cast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Vote failed." }));
        alert(payload.error ?? "Vote failed.");
        return;
      }

      setVotes((prev) =>
        prev.map((voteItem) =>
          voteItem.id === voteId
            ? {
                ...voteItem,
                hasVoted: true,
                _count: { ballots: voteItem._count.ballots + 1 },
              }
            : voteItem,
        ),
      );
    } catch (error) {
      console.error("Vote error:", error);
    } finally {
      setCastingId(null);
    }
  }

  if (loading) {
    return <p className="rounded-xl border border-ink-border bg-white p-8 text-center text-sm text-ink/55">Loading active votes...</p>;
  }

  const activeVotes = votes.filter((voteItem) => voteItem.status === "active");

  if (activeVotes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ink-border bg-white p-10 text-center text-ink/60">
        <Globe2 className="mx-auto h-12 w-12 opacity-30" />
        <p className="mt-4 text-sm">No active resolution is currently open for voting.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/55">
        Signed in as {currentUserRole} ({currentUserId.slice(0, 6)})
      </p>

      {activeVotes.map((voteItem) => (
        <article key={voteItem.id} className="rounded-xl border border-ink-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-serif text-2xl font-bold text-ink">{voteItem.title}</h3>
            <StatusBadge tone="live">Open</StatusBadge>
          </div>

          {voteItem.description ? <p className="text-sm text-ink/70">{voteItem.description}</p> : null}

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.08em] text-ink/55">
            <span className="inline-flex items-center gap-1">
              {voteItem.visibility === "secret" ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              {voteItem.visibility === "secret" ? "Secret ballot" : "Public ballot"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {voteItem.ballotMode === "per_delegation" ? "1 vote per delegation" : "1 vote per person"}
            </span>
            <span>{voteItem._count.ballots} ballots submitted</span>
          </div>

          <div className="mt-4">
            {!voteItem.isEligible ? (
              <p className="rounded-lg border border-ink-border bg-ivory px-4 py-3 text-sm text-ink/60">
                You are not eligible for this vote.
              </p>
            ) : voteItem.hasVoted ? (
              <p className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Vote registered.
              </p>
            ) : (
              <div className="grid gap-2">
                {voteItem.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => castVote(voteItem.id, option.id)}
                    disabled={castingId === voteItem.id}
                    className="flex items-center justify-between rounded-lg border border-ink-border bg-ivory px-4 py-3 text-left text-sm font-semibold text-ink transition hover:border-ink-blue hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {option.label}
                    <span className="h-3 w-3 rounded-full border border-ink/35" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
