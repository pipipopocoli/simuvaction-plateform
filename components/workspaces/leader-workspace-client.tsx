"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, FileCheck2, LayoutDashboard, Clock, FileText, MessageSquare } from "lucide-react";
import Link from "next/link";
import { AdminVotePanel } from "@/components/voting/admin-vote-panel";
import { LeaderNewsApprovalPanel } from "@/components/newsroom/leader-news-approval-panel";
import { TeamDraftEditor } from "@/components/teams/team-draft-editor";
import { TwitterFeedPanel } from "@/components/newsroom/twitter-feed-panel";
import { Panel, StatTile, StatusBadge, ActionButton } from "@/components/ui/commons";
import { NotionWorkspace } from "@/components/workspace/notion-workspace";
import { MeetingRequestsPanel } from "@/components/meetings/meeting-requests-panel";
import { AgendaPanel } from "@/components/meetings/agenda-panel";
import { WorkspaceCalendar } from "@/components/meetings/workspace-calendar";

type DeadlineItem = {
  id: string;
  title: string;
  date: string;
};

type DocumentItem = {
  id: string;
  title: string;
  type: string;
  url: string;
};

export function LeaderWorkspaceClient({ userId, role }: { userId: string; role: string }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [shortStance, setShortStance] = useState("");
  const [longStance, setLongStance] = useState("");
  const [isSavingStance, setIsSavingStance] = useState(false);
  const [stanceSaved, setStanceSaved] = useState(false);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  useEffect(() => {
    fetch("/api/admin/deadlines").then(res => res.json()).then(data => {
      if (!data.error) setDeadlines(data);
    });
    fetch("/api/admin/documents").then(res => res.json()).then(data => {
      if (!data.error) setDocuments(data);
    });
    fetch("/api/teams/profile").then(res => res.json()).then(data => {
      if (!data.error) {
        if (data.stanceShort) setShortStance(data.stanceShort);
        if (data.stanceLong) setLongStance(data.stanceLong);
      }
    });
  }, []);

  const saveStance = async () => {
    setIsSavingStance(true);
    setStanceSaved(false);
    try {
      const res = await fetch("/api/teams/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stanceShort: shortStance, stanceLong: longStance })
      });
      if (res.ok) {
        setStanceSaved(true);
        setTimeout(() => setStanceSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingStance(false);
    }
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "briefing", label: "Briefing" },
    { id: "drafts", label: "Drafts" },
    { id: "workspace", label: "Workspace" },
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

          {activeTab === "drafts" ? (
            <TeamDraftEditor />
          ) : null}

          {activeTab === "workspace" ? (
            <NotionWorkspace userId={userId} workspaceKey="leader" />
          ) : null}

          {activeTab === "briefing" ? (
            <div className="space-y-4">
              <div>
                <h2 className="flex items-center gap-2 font-serif text-3xl font-bold text-ink">
                  <FileText className="h-6 w-6 text-ink-blue" /> Position Paper
                </h2>
                <p className="mt-2 text-sm text-ink/70">
                  Edit the official delegation stance. This updates your public profile on the global map.
                </p>
              </div>

              <div>
                <label htmlFor="short-stance" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/55">
                  Short stance (max 140)
                </label>
                <textarea
                  id="short-stance"
                  rows={2}
                  value={shortStance}
                  onChange={(event) => setShortStance(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink-border bg-ivory px-3 py-2 text-sm outline-none focus:border-ink-blue"
                />
              </div>

              <div>
                <label htmlFor="long-stance" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/55">
                  Internal notes
                </label>
                <textarea
                  id="long-stance"
                  value={longStance}
                  onChange={(event) => setLongStance(event.target.value)}
                  placeholder="Negotiation boundaries, red lines, and bilateral strategy."
                  className="mt-1 min-h-[170px] w-full rounded-lg border border-ink-border bg-ivory px-3 py-2 text-sm outline-none focus:border-ink-blue"
                />
              </div>

              <div className="flex justify-end gap-3 items-center">
                {stanceSaved && <span className="text-xs text-emerald-600 font-bold">Safely stored!</span>}
                <ActionButton onClick={saveStance} disabled={isSavingStance}>
                  {isSavingStance ? "Saving..." : "Save Public Stance"}
                </ActionButton>
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
              <h2 className="mb-3 flex items-center gap-2 font-serif text-3xl font-bold text-ink">
                <Clock className="h-6 w-6 text-alert-red" /> Official Schedule
              </h2>
              <p className="mb-4 text-sm text-ink/70">Review the official schedule and countdowns for the simulation event.</p>
              <div className="space-y-3">
                {deadlines.length === 0 ? <p className="text-sm text-ink/55 italic">No incoming deadlines scheduled.</p> : deadlines.map((d) => (
                  <div key={d.id} className="p-3 border border-ink-border rounded bg-white">
                    <p className="text-sm font-semibold text-ink">{d.title}</p>
                    <p className="text-xs text-alert-red font-bold">{new Date(d.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "documents" ? (
            <div>
              <h2 className="mb-3 flex items-center gap-2 font-serif text-3xl font-bold text-ink">
                <FileText className="h-6 w-6 text-ink-blue" /> Global Library
              </h2>
              <p className="mb-4 text-sm text-ink/70">Consult official resources provided by the administration.</p>
              <div className="space-y-3">
                {documents.length === 0 ? <p className="text-sm text-ink/55 italic">No shared documents.</p> : documents.map((d) => (
                  <div key={d.id} className="p-3 border border-ink-border rounded bg-white flex justify-between items-center">
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-ink-blue hover:underline">{d.title}</a>
                    <span className="text-[10px] text-zinc-500 uppercase font-mono bg-zinc-100 px-2 py-0.5 rounded">{d.type}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "messages" ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center">
              <div className="h-12 w-12 rounded-full bg-ink-blue/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-ink-blue" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-ink mb-1">Secure Communications Center</h3>
                <p className="text-sm text-ink/60 mb-4 max-w-sm mx-auto">Access the Global Assembly channels and initiate bilateral negotiations with other delegations.</p>
                <Link href="/chat" className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink-blue px-6 py-2.5 text-sm font-bold text-white hover:bg-ink-blue-hover transition shadow-sm">
                  Launch Comms Interface
                </Link>
              </div>
            </div>
          ) : null}
        </Panel>
      </div>

      <div className="space-y-4 xl:col-span-4">
        <MeetingRequestsPanel />

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

        <TwitterFeedPanel hashtag="SimuVaction2026" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <AgendaPanel />
          <WorkspaceCalendar />
        </div>
      </div>
    </div>
  );
}
