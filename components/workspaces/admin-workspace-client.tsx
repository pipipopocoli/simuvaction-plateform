"use client";

import { useState } from "react";
import { ShieldCheck, CalendarClock, BookOpen, Activity, Eye } from "lucide-react";
import { AdminDeadlinesPanel } from "@/components/admin/admin-deadlines-panel";
import { AdminDocumentsPanel } from "@/components/admin/admin-documents-panel";
import { GameMasterDraftMonitor } from "@/components/admin/game-master-draft-monitor";
import { Panel, StatTile } from "@/components/ui/commons";

export function AdminWorkspaceClient({ userId, role }: { userId: string; role: string }) {
    const [activeTab, setActiveTab] = useState("overview");

    const tabs = [
        { id: "overview", label: "Overview" },
        { id: "monitoring", label: "Draft Monitoring" },
        { id: "deadlines", label: "Schedule & Deadlines" },
        { id: "documents", label: "Course Documents" },
    ];

    return (
        <div className="grid gap-6 xl:grid-cols-12">
            <div className="xl:col-span-9">
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

                    {activeTab === "overview" && (
                        <div>
                            <h2 className="mb-3 flex items-center gap-2 font-serif text-3xl font-bold text-ink">
                                <Activity className="h-6 w-6 text-alert-red" /> Simulation Health
                            </h2>
                            <p className="mb-4 text-sm text-ink/70">
                                A quick overview of the simulation progress and student engagement.
                            </p>
                            <div className="grid gap-3 md:grid-cols-3">
                                <StatTile label="Professor Access" value="ACTIVE" tone="accent" />
                                <StatTile label="Draft Monitor" value="Live" tone="alert" />
                                <StatTile label="Syllabus Docs" value="Manage" />
                            </div>
                        </div>
                    )}

                    {activeTab === "monitoring" && (
                        <div>
                            <h2 className="mb-3 flex items-center gap-2 font-serif text-3xl font-bold text-ink">
                                <Eye className="h-6 w-6 text-alert-red" /> Draft Surveillance
                            </h2>
                            <p className="mb-4 text-sm text-ink/70">
                                Observe the live writing progress of all delegations to guide your GM interventions.
                            </p>
                            <GameMasterDraftMonitor />
                        </div>
                    )}

                    {activeTab === "deadlines" && (
                        <div>
                            <h2 className="mb-3 flex items-center gap-2 font-serif text-3xl font-bold text-ink">
                                <CalendarClock className="h-6 w-6 text-ink-blue" /> Master Schedule
                            </h2>
                            <p className="mb-4 text-sm text-ink/70">
                                Define the official course schedule. These deadlines will appear on all student dashboards.
                            </p>
                            <AdminDeadlinesPanel />
                        </div>
                    )}

                    {activeTab === "documents" && (
                        <div>
                            <h2 className="mb-3 flex items-center gap-2 font-serif text-3xl font-bold text-ink">
                                <BookOpen className="h-6 w-6 text-alert-red" /> Course Library
                            </h2>
                            <p className="mb-4 text-sm text-ink/70">
                                Upload syllabus documents, rubrics, and research material for the entire class.
                            </p>
                            <AdminDocumentsPanel />
                        </div>
                    )}
                </Panel>
            </div>

            <div className="space-y-4 xl:col-span-3">
                <Panel variant="soft" className="border-ink-blue/20 bg-ink-blue/5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-blue">System Authority</p>
                    <p className="mt-2 font-serif text-2xl font-bold text-ink flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-ink-blue" />
                        ADMINISTRATOR
                    </p>
                    <p className="mt-1 text-sm text-ink/65">User ID: {userId.slice(0, 10)}</p>
                </Panel>

                <Panel>
                    <p className="text-sm font-semibold text-ink mb-2">Notice</p>
                    <p className="text-xs text-ink/70 leading-relaxed">
                        This workspace is isolated from the simulation role-play. It is designed for instructional staff to dictate the pacing and reference materials of the course.
                    </p>
                </Panel>
            </div>
        </div>
    );
}
