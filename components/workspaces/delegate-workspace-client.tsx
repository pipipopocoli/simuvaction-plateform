"use client";

import { useState } from "react";
import { CheckCircle2, FileText, Info } from "lucide-react";
import { VoteDashboard } from "@/components/voting/vote-dashboard";
import { ActionButton, Panel, StatusBadge, TimelineItem } from "@/components/ui/commons";

export function DelegateWorkspaceClient({ userId, role }: { userId: string; role: string }) {
  const [activeTab, setActiveTab] = useState("briefing");
  const [shortStance, setShortStance] = useState(
    "Conditional support for the green fund if technology transfer guarantees are included.",
  );
  const [longStance, setLongStance] = useState("");

  const tabs = [
    { id: "briefing", label: "Briefing" },
    { id: "tasks", label: "Tasks" },
    { id: "drafts", label: "Drafts" },
    { id: "meetings", label: "Meetings" },
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
                className={`-mb-px px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
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

              <div className="flex justify-end">
                <ActionButton>Submit to leaders</ActionButton>
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

          {activeTab !== "briefing" && activeTab !== "votes" ? (
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
          <h3 className="font-serif text-2xl font-bold text-ink">Upcoming Deadlines</h3>
          <div className="mt-3 space-y-3">
            <TimelineItem time="Feb 23" title="Vote closes at 14:00" tone="alert" />
            <TimelineItem time="Feb 24" title="Editorial committee submission" tone="accent" />
          </div>
        </Panel>
      </div>
    </div>
  );
}
