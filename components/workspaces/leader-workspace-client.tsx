"use client";

import { useState } from "react";
import { CheckCircle2, FileCheck2, Info, LayoutDashboard } from "lucide-react";
import { AdminVotePanel } from "@/components/voting/admin-vote-panel";
import { LeaderNewsApprovalPanel } from "@/components/newsroom/leader-news-approval-panel";
import { AdminDeadlinesPanel } from "@/components/admin/admin-deadlines-panel";
import { AdminDocumentsPanel } from "@/components/admin/admin-documents-panel";
import { TwitterFeedPanel } from "@/components/newsroom/twitter-feed-panel";
import { Panel, StatTile, StatusBadge } from "@/components/ui/commons";

export function LeaderWorkspaceClient({ userId, role }: { userId: string; role: string }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "votes", label: "Votes" },
    { id: "approvals", label: "Approvals" },
    { id: "deadlines", label: "Deadlines" },
    { id: "documents", label: "Library" },
    { id: "messages", label: "Messages" },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <div className="xl:col-span-8">
        <Panel>
          <div className="mb-4 flex flex-wrap border-b border-ink-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`-mb-px px-4 py-2 text-sm font-semibold transition ${activeTab === tab.id
                  ? "border-b-2 border-alert-red text-alert-red"
                  : "text-ink/55 hover:text-ink"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "dashboard" ? (
            <div>
              <h2 className="mb-3 flex items-center gap-2 font-serif text-3xl font-bold text-ink">
                <LayoutDashboard className="h-6 w-6 text-alert-red" /> Command Dashboard
              </h2>
              <p className="mb-4 text-sm text-ink/70">Global metrics for this simulation event.</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <StatTile label="Delegations" value="12" />
                <StatTile label="Passed resolutions" value="4" />
                <StatTile label="Active votes" value="1" tone="alert" />
                <StatTile label="Articles pending" value="3" tone="accent" />
              </div>
            </div>
          ) : null}

          {activeTab === "votes" ? (
            <div>
              <h2 className="mb-3 flex items-center gap-2 font-serif text-3xl font-bold text-ink">
                <CheckCircle2 className="h-6 w-6 text-ink-blue" /> Resolution Management
              </h2>
              <p className="mb-4 text-sm text-ink/70">Launch ballots, set quorum, and monitor participation.</p>
              <AdminVotePanel />
            </div>
          ) : null}

          {activeTab === "approvals" ? (
            <div>
              <h2 className="mb-3 flex items-center gap-2 font-serif text-3xl font-bold text-ink">
                <FileCheck2 className="h-6 w-6 text-alert-red" /> News Approval
              </h2>
              <p className="mb-4 text-sm text-ink/70">Finalize newsroom content once journalist quorum is reached.</p>
              <LeaderNewsApprovalPanel userId={userId} />
            </div>
          ) : null}

          {activeTab === "deadlines" ? (
            <div>
              <p className="mb-4 text-sm text-ink/70">Manage the official schedule and countdowns for the entire simulation event.</p>
              <AdminDeadlinesPanel />
            </div>
          ) : null}

          {activeTab === "documents" ? (
            <div>
              <p className="mb-4 text-sm text-ink/70">Upload or link official resources for all delegations to access in the Library.</p>
              <AdminDocumentsPanel />
            </div>
          ) : null}

          {activeTab === "messages" ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center text-ink/55">
              <Info className="h-8 w-8" />
              <p className="text-sm">Global moderation tools for leadership messages are rolling out.</p>
            </div>
          ) : null}
        </Panel>
      </div>

      <div className="space-y-4 xl:col-span-4">
        <Panel variant="soft">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-2xl font-bold text-ink">Leadership Queue</h3>
            <StatusBadge tone="alert">3 pending</StatusBadge>
          </div>
          <div className="mt-3 space-y-3">
            <div className="rounded-lg border border-ink-border bg-white p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Newsroom</p>
              <p className="mt-1 text-sm font-semibold text-ink">Mediterranean crisis brief</p>
              <p className="mt-1 text-xs text-ink/65">Requires final leader vote.</p>
            </div>
            <div className="rounded-lg border border-ink-border bg-white p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Parliament</p>
              <p className="mt-1 text-sm font-semibold text-ink">Quorum check in progress</p>
              <p className="mt-1 text-xs text-ink/65">Climate package vote is at 68% participation.</p>
            </div>
          </div>
        </Panel>

        <Panel>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Current operator</p>
          <p className="mt-2 font-serif text-2xl font-bold text-ink">{role.toUpperCase()}</p>
          <p className="mt-1 text-sm text-ink/65">Identity: {userId.slice(0, 10)}</p>
        </Panel>

        <TwitterFeedPanel hashtag="SimuVaction2024" />
      </div>
    </div>
  );
}
