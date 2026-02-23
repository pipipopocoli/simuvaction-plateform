"use client";

import { useState } from "react";
import { AdminVotePanel } from "@/components/voting/admin-vote-panel";
import { LeaderNewsApprovalPanel } from "@/components/newsroom/leader-news-approval-panel";
import { CheckCircle2, Info, LayoutDashboard, FileCheck2, Settings } from "lucide-react";

export function LeaderWorkspaceClient({ userId, role }: { userId: string, role: string }) {
    const [activeTab, setActiveTab] = useState("dashboard");

    const tabs = [
        { id: "dashboard", label: "Dashboard" },
        { id: "votes", label: "Votes (Admin)" },
        { id: "approvals", label: "Approvals" },
        { id: "messages", label: "Global Messages" }
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-8 font-sans text-ink">

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Internal Navigation Tabs */}
                <div className="flex overflow-x-auto border-b-2 border-ink-border mb-6 no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? "text-alert-red border-b-2 border-alert-red -mb-[2px]"
                                : "text-ink/50 hover:text-ink/80 hover:bg-ink/5"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* TAB CONTENT */}
                <div className="bg-white border border-ink-border rounded-sm p-6 shadow-sm min-h-[500px]">

                    {activeTab === "dashboard" && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <h2 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                                <LayoutDashboard className="w-5 h-5 text-alert-red" /> Global Command
                            </h2>
                            <p className="text-sm text-ink/70 mb-4">Vue d'ensemble des métriques de la session actuelle.</p>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="border border-ink-border p-4 rounded-sm bg-ivory">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink/50">Délégations</h4>
                                    <p className="text-3xl font-serif font-bold text-ink mt-2">12</p>
                                </div>
                                <div className="border border-ink-border p-4 rounded-sm bg-ivory">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink/50">Résolutions Passées</h4>
                                    <p className="text-3xl font-serif font-bold text-ink mt-2">4</p>
                                </div>
                                <div className="border border-alert-red/30 p-4 rounded-sm bg-alert-red/5">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-alert-red flex justify-between">
                                        Votes Actifs <span className="relative flex h-2 w-2 mt-0.5"><span className="animate-ping absolute h-full w-full rounded-full bg-alert-red opacity-75"></span><span className="relative rounded-full h-2 w-2 bg-alert-red"></span></span>
                                    </h4>
                                    <p className="text-3xl font-serif font-bold text-alert-red mt-2">1</p>
                                </div>
                                <div className="border border-ink-border p-4 rounded-sm bg-ivory">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink/50">Articles en Attente</h4>
                                    <p className="text-3xl font-serif font-bold text-ink mt-2">3</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "votes" && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-ink-blue" /> Gestion des Résolutions
                            </h2>
                            <p className="text-sm text-ink/70 mb-6">Contrôlez les scrutins, ajustez les règles de quorum et suivez la participation en direct.</p>
                            <AdminVotePanel />
                        </div>
                    )}

                    {activeTab === "approvals" && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                                <FileCheck2 className="w-5 h-5 text-alert-red" /> Approbation des Dépêches
                            </h2>
                            <p className="text-sm text-ink/70 mb-6">Validation finale des articles. (Requiert 2 approbations préalables de journalistes).</p>
                            <LeaderNewsApprovalPanel userId={userId} />
                        </div>
                    )}

                    {activeTab !== "dashboard" && activeTab !== "votes" && activeTab !== "approvals" && (
                        <div className="flex flex-col items-center justify-center h-full text-ink/40 space-y-4 py-20">
                            <Info className="w-8 h-8 opacity-50" />
                            <p className="text-sm font-medium text-center max-w-sm">Le module {tabs.find((t) => t.id === activeTab)?.label} du Leader est en cours de développement.</p>
                        </div>
                    )}

                </div>
            </div>

            {/* SIDEBAR: System Alerts & Queue */}
            <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">

                {/* Pending Actions */}
                <div className="bg-white border border-alert-red/30 rounded-sm shadow-sm overflow-hidden">
                    <div className="bg-alert-red/10 border-b border-alert-red/20 text-alert-red p-4 flex justify-between items-center">
                        <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <FileCheck2 className="w-4 h-4" /> Approbations
                        </h3>
                        <span className="bg-alert-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full">3</span>
                    </div>
                    <div className="divide-y divide-ink-border">
                        <div className="p-4 hover:bg-ivory cursor-pointer transition-colors group">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-bold uppercase text-ink">Newsroom</span>
                                <span className="text-[10px] text-ink/50 font-mono">10:05</span>
                            </div>
                            <p className="text-sm font-semibold group-hover:text-ink-blue transition-colors leading-tight">Crise en Méditerranée Centrale</p>
                            <p className="text-xs text-ink/70 mt-1 line-clamp-1">Par Journaliste Principal</p>
                            <div className="flex gap-2 mt-3">
                                <button className="flex-1 bg-ink text-ivory text-xs font-bold py-1.5 rounded-sm hover:bg-ink-blue">Review</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
