"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { CheckCircle, XCircle } from "lucide-react";
import { ActionButton, Panel, StatusBadge } from "@/components/ui/commons";

type NewsPost = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  author: { name: string; role: string };
  stats: {
    journalistApprovals: number;
    leaderApprovals: number;
    requiredJournalists: number;
    requiredLeaders: number;
  };
  hasUserVoted: boolean;
};

export function LeaderNewsApprovalPanel({ userId }: { userId: string }) {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchQueue() {
    setLoading(true);
    try {
      const response = await fetch("/api/news?filter=review_queue");
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as NewsPost[];
      setNews(payload);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQueue();
  }, []);

  async function handleReview(id: string, decision: "approve" | "reject") {
    if (decision === "reject" && !confirm("Reject this article and return it to the author?")) {
      return;
    }

    try {
      await fetch(`/api/news/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      await fetchQueue();
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return <p className="rounded-xl border border-ink-border bg-white p-8 text-center text-sm text-ink/55">Loading review queue...</p>;
  }

  if (news.length === 0) {
    return (
      <Panel className="text-center">
        <h3 className="font-serif text-2xl font-bold text-ink">No pending article</h3>
        <p className="mt-2 text-sm text-ink/65">Every submitted story has already been processed.</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/55">
        Reviewer {userId.slice(0, 8)}
      </p>

      {news.map((item) => {
        const createdAt = DateTime.fromISO(item.createdAt).isValid
          ? DateTime.fromISO(item.createdAt).toFormat("dd LLL yyyy HH:mm")
          : "Unknown time";

        const enoughJournalistVotes = item.stats.journalistApprovals >= item.stats.requiredJournalists;

        return (
          <Panel key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-2xl font-bold text-ink">{item.title}</h3>
                <p className="mt-1 text-sm text-ink/65">
                  Submitted by {item.author.name} • {createdAt}
                </p>
              </div>
              <StatusBadge tone="live">In review</StatusBadge>
            </div>

            <p className="mt-4 whitespace-pre-wrap rounded-lg border border-ink-border bg-ivory p-4 text-sm text-ink/80">{item.body}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.08em] text-ink/55">
              <span>
                Journalist approvals {item.stats.journalistApprovals}/{item.stats.requiredJournalists}
              </span>
              <span>
                Leader approvals {item.stats.leaderApprovals}/{item.stats.requiredLeaders}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-border pt-4">
              <p className="text-sm text-ink/65">
                {enoughJournalistVotes
                  ? "Journalist quorum reached. Final validation is ready."
                  : "Waiting for journalist quorum before final publication."}
              </p>

              <div className="flex gap-2">
                {item.hasUserVoted ? (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-ink-border bg-white px-3 py-2 text-sm font-semibold text-ink/65">
                    <CheckCircle className="h-4 w-4" /> Vote recorded
                  </span>
                ) : (
                  <>
                    <ActionButton variant="secondary" onClick={() => handleReview(item.id, "reject")}>
                      <XCircle className="h-4 w-4" /> Reject
                    </ActionButton>
                    <ActionButton
                      onClick={() => handleReview(item.id, "approve")}
                      disabled={!enoughJournalistVotes}
                      title={enoughJournalistVotes ? "Approve article" : "Need journalist quorum first"}
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </ActionButton>
                  </>
                )}
              </div>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
