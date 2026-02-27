"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Globe, Megaphone, Users, Twitter, CheckCircle2 } from "lucide-react";
import { VoteDashboard } from "@/components/voting/vote-dashboard";
import { TeamDraftEditor } from "@/components/teams/team-draft-editor";
import { NotionWorkspace } from "@/components/workspace/notion-workspace";
import { Panel, StatusBadge, TimelineItem } from "@/components/ui/commons";
import { TwitterFeedPanel } from "@/components/newsroom/twitter-feed-panel";
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
    url: string;
};

export function LobbyistWorkspaceClient({ userId, role }: { userId: string; role: string }) {
    const [activeTab, setActiveTab] = useState("hub");
    const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
    const [documents, setDocuments] = useState<DocumentItem[]>([]);

    useEffect(() => {
        fetch("/api/admin/deadlines").then(r => r.json()).then(d => { if (!d.error) setDeadlines(d); });
        fetch("/api/admin/documents").then(r => r.json()).then(d => { if (!d.error) setDocuments(d); });
    }, []);

    const tabs = [
        { id: "hub", label: "Lobby Hub", icon: <Globe className="h-4 w-4" /> },
        { id: "workspace", label: "Workspace", icon: <Megaphone className="h-4 w-4" /> },
        { id: "drafts", label: "Position Paper", icon: <MessageCircle className="h-4 w-4" /> },
        { id: "votes", label: "Votes", icon: <CheckCircle2 className="h-4 w-4" /> },
        { id: "social", label: "Social Feed", icon: <Twitter className="h-4 w-4" /> },
    ];

    return (
        <div className="grid gap-6 xl:grid-cols-12">
            <div className="xl:col-span-8">
                <Panel>
                    <div className="mb-4 flex flex-wrap gap-1 border-b border-ink-border pb-3">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 -mb-px px-3 py-1.5 text-sm font-semibold rounded-md transition ${activeTab === tab.id ? "bg-ink-blue text-white" : "text-ink/55 hover:text-ink hover:bg-ink-border/30"
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === "hub" && (
                        <div className="space-y-4">
                            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-4">
                                <h2 className="font-serif text-2xl font-bold text-ink flex items-center gap-2 mb-2">
                                    <Globe className="h-6 w-6 text-amber-500" /> Lobby Operations
                                </h2>
                                <p className="text-sm text-ink/70 mb-4">
                                    You represent a private corporation. Your goal is to influence delegations to support policies
                                    favourable to your organization&apos;s interests. Use bilateral meetings, informal channels, and
                                    the press to shape the simulation outcome.
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white rounded-lg p-3 border border-amber-200">
                                        <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Your Strategy</p>
                                        <p className="text-sm text-ink">Identify delegations with aligned interests. Build coalitions before key votes.</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-amber-200">
                                        <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Key Tools</p>
                                        <p className="text-sm text-ink">Direct messages, position papers, press conferences, bilateral meetings.</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-serif text-lg font-bold text-ink mb-3 flex items-center gap-2">
                                    <Users className="h-5 w-5 text-ink-blue" /> Target Delegations
                                </h3>
                                <p className="text-sm text-ink/60 italic">Open the Messages section to initiate bilateral contacts with delegation leaders.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === "workspace" && <NotionWorkspace teamName="Lobby" userId={userId} workspaceKey="lobbyist" />}
                    {activeTab === "drafts" && <TeamDraftEditor />}
                    {activeTab === "votes" && (
                        <div>
                            <h2 className="mb-3 font-serif text-2xl font-bold text-ink flex items-center gap-2">
                                <CheckCircle2 className="h-6 w-6 text-amber-500" /> Active Votes
                            </h2>
                            <p className="text-sm text-ink/60 mb-4">Monitor open resolutions. As a lobbyist, you cannot vote, but you can influence the vote through your contacts.</p>
                            <VoteDashboard currentUserId={userId} currentUserRole={role} />
                        </div>
                    )}
                    {activeTab === "social" && (
                        <div className="space-y-4">
                            <h2 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
                                <Twitter className="h-6 w-6 text-blue-400" /> Social Media Monitoring
                            </h2>
                            <p className="text-sm text-ink/60">Track the public narrative. Use Twitter to amplify your corporation&apos;s positions.</p>
                            <TwitterFeedPanel hashtag="SimuVaction2026" />
                        </div>
                    )}
                </Panel>
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-4 space-y-4">
                <MeetingRequestsPanel />

                <Panel variant="soft" className="border-amber-200/50 bg-amber-50/30">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600">Lobbyist Identity</p>
                    <p className="mt-1 font-serif text-xl font-bold text-ink">{userId.slice(0, 8)}…</p>
                    <StatusBadge tone="neutral" className="mt-2">Lobbyist Access</StatusBadge>
                </Panel>

                <Panel variant="soft">
                    <h3 className="font-serif text-lg font-bold text-ink mb-3">Official Schedule</h3>
                    {deadlines.length === 0
                        ? <p className="text-xs text-ink/50 italic">No upcoming deadlines.</p>
                        : deadlines.map(d => (
                            <TimelineItem key={d.id} time={new Date(d.date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })} title={d.title} tone="alert" />
                        ))
                    }
                </Panel>

                {documents.length > 0 && (
                    <Panel variant="soft">
                        <h3 className="font-serif text-lg font-bold text-ink mb-3">Course Library</h3>
                        {documents.map((d) => (
                            <div key={d.id} className="pb-2 mb-2 border-b border-ink-border last:border-0">
                                <a href={d.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-ink-blue hover:underline">{d.title}</a>
                            </div>
                        ))}
                    </Panel>
                )}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <AgendaPanel />
                    <WorkspaceCalendar />
                </div>
            </div>
        </div>
    );
}
