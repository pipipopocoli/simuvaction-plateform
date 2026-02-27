"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Info, Clock, MessageSquare } from "lucide-react";
import { VoteDashboard } from "@/components/voting/vote-dashboard";
import { TeamDraftEditor } from "@/components/teams/team-draft-editor";
import { NotionWorkspace } from "@/components/workspace/notion-workspace";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { ActionButton, Panel, StatusBadge, TimelineItem } from "@/components/ui/commons";
import { TwitterFeedPanel } from "@/components/newsroom/twitter-feed-panel";

export function DelegateWorkspaceClient({ userId, role }: { userId: string; role: string }) {
  const [activeTab, setActiveTab] = useState("briefing");
  const [shortStance, setShortStance] = useState("");
  const [longStance, setLongStance] = useState("");
  const [isSavingStance, setIsSavingStance] = useState(false);
  const [stanceSaved, setStanceSaved] = useState(false);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

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
    { id: "briefing", label: "Briefing" },
    { id: "workspace", label: "Workspace" },
    { id: "drafts", label: "Drafts" },
    { id: "votes", label: "Votes" },
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
                  ? "border-b-2 border-ink-blue text-ink-blue"
                  : "text-ink/55 hover:text-ink"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "briefing" ? (
            <div className="space-y-4">
              <div>
                <h2 className="flex items-center gap-2 font-serif text-3xl font-bold text-ink">
                  <FileText className="h-6 w-6 text-ink-blue" /> Position Paper
                </h2>
                <p className="mt-2 text-sm text-ink/70">
                  Edit the official delegation stance. Leaders can validate this draft before publication.
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
              <h2 className="mb-2 flex items-center gap-2 font-serif text-3xl font-bold text-ink">
                <CheckCircle2 className="h-6 w-6 text-ink-blue" /> Voting Room
              </h2>
              <p className="mb-4 text-sm text-ink/70">Review active resolutions and cast your delegation ballot.</p>
              <VoteDashboard currentUserId={userId} currentUserRole={role} />
            </div>
          ) : null}

          {activeTab === "drafts" ? (
            <TeamDraftEditor />
          ) : null}

          {activeTab === "workspace" ? (
            <NotionWorkspace />
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
          ) : activeTab !== "briefing" && activeTab !== "votes" && activeTab !== "drafts" && activeTab !== "workspace" ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center text-ink/55">
              <Info className="h-8 w-8" />
              <p className="text-sm">This workspace module is active in progressive rollout for delegates.</p>
            </div>
          ) : null}
        </Panel>
      </div>

      <div className="space-y-4 xl:col-span-4">
        <Panel>
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-2xl font-bold text-ink">Inbox</h3>
            <StatusBadge tone="alert">2</StatusBadge>
          </div>

          <div className="mt-3 space-y-3">
            <div className="rounded-lg border border-ink-border bg-ivory p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-blue">Invitation</p>
              <p className="mt-1 text-sm font-semibold text-ink">Bilateral request received</p>
              <p className="mt-1 text-xs text-ink/65">European delegation requests a video meeting on Arctic terms.</p>
            </div>
            <div className="rounded-lg border border-ink-border bg-white p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">System</p>
              <p className="mt-1 text-sm font-semibold text-ink">Stance accepted</p>
              <p className="mt-1 text-xs text-ink/65">Leadership validated your latest delegation draft.</p>
            </div>
          </div>
        </Panel>

        <Panel variant="soft">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-2xl font-bold text-ink">Upcoming Deadlines</h3>
            <Clock className="w-5 h-5 text-alert-red" />
          </div>
          <div className="space-y-3">
            {deadlines.length === 0 ? <p className="text-xs text-ink/55 italic">No incoming deadlines scheduled.</p> : deadlines.map((d: any) => (
              <TimelineItem key={d.id} time={new Date(d.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} title={d.title} tone="alert" />
            ))}
          </div>
        </Panel>

        <Panel variant="soft">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-2xl font-bold text-ink">Global Library</h3>
            <FileText className="w-5 h-5 text-ink-blue" />
          </div>
          <div className="space-y-3">
            {documents.length === 0 ? <p className="text-xs text-ink/55 italic">No official documents yet.</p> : documents.map((d: any) => (
              <div key={d.id} className="border-b border-ink-border pb-2 last:border-0">
                <a href={d.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-ink-blue hover:underline block mb-1">{d.title}</a>
                <span className="inline-block bg-ivory border border-zinc-200 text-zinc-500 rounded px-1 text-[9px] uppercase font-bold tracking-widest">{d.type}</span>
              </div>
            ))}
          </div>
        </Panel>

        <TwitterFeedPanel hashtag="SimuVaction2024" />
      </div>
    </div>
  );
}
