"use client";

import { useState } from "react";
import { VoteDashboard } from "@/components/voting/vote-dashboard";
import { FileText, CheckCircle2, MessageSquare, Video, Info, Lock } from "lucide-react";

export function DelegateWorkspaceClient({ userId, role }: { userId: string, role: string }) {
    const [activeTab, setActiveTab] = useState("briefing");

    // Mock State for the Editor
    const [shortStance, setShortStance] = useState("Soutien conditionnel au fonds vert à condition que les transferts technologiques soient garantis.");
    const [longStance, setLongStance] = useState("");

    const tabs = [
        { id: "briefing", label: "Briefing" },
        { id: "tasks", label: "Tasks" },
        { id: "drafts", label: "Drafts" },
        { id: "meetings", label: "Meetings" },
        { id: "votes", label: "Votes" },
        { id: "messages", label: "Messages" }
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
                                ? "text-ink-blue border-b-2 border-ink-blue -mb-[2px]"
                                : "text-ink/50 hover:text-ink/80 hover:bg-ink/5"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* TAB CONTENT */}
                <div className="bg-white border border-ink-border rounded-sm p-6 shadow-sm min-h-[500px]">

                    {activeTab === "briefing" && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h2 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-ink-blue" /> Position Paper
                                </h2>
                                <p className="text-sm text-ink/70 mb-4">Éditez la position officielle (stance) de votre délégation. Cette version sera soumise aux leaders et pourra être consultée par d'autres délégations si elle est rendue publique.</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-ink/60 mb-2">Stance Courte (140 caractères max)</label>
                                        <textarea
                                            className="w-full border border-ink-border bg-ivory focus:bg-white rounded-sm p-3 text-sm font-medium focus:outline-none focus:border-ink-blue transition-colors resize-none"
                                            rows={2}
                                            value={shortStance}
                                            onChange={(e) => setShortStance(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-ink/60 mb-2">Notes Privées / Stance Longue</label>
                                        <textarea
                                            className="w-full border border-ink-border bg-ivory focus:bg-white rounded-sm p-3 text-sm focus:outline-none focus:border-ink-blue transition-colors min-h-[150px]"
                                            placeholder="Stratégie interne, points de négociation non-négociables..."
                                            value={longStance}
                                            onChange={(e) => setLongStance(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button className="bg-ink text-ivory hover:bg-ink-blue transition-colors px-6 py-2 text-sm font-bold rounded-sm shadow-sm">
                                            Submit to Leaders
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "votes" && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-ink-blue" /> Salle des Votes
                            </h2>
                            <p className="text-sm text-ink/70 mb-6">Examinez les résolutions et scellez le vote de votre délégation.</p>
                            <VoteDashboard currentUserId={userId} currentUserRole={role} />
                        </div>
                    )}

                    {activeTab !== "briefing" && activeTab !== "votes" && (
                        <div className="flex flex-col items-center justify-center h-full text-ink/40 space-y-4 py-20">
                            <Info className="w-8 h-8 opacity-50" />
                            <p className="text-sm font-medium text-center max-w-sm">Le module {tabs.find((t) => t.id === activeTab)?.label} est en cours de déploiement sécurisé par le haut commandement.</p>
                        </div>
                    )}

                </div>
            </div>

            {/* SIDEBAR: Inbox & Deadlines */}
            <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">

                {/* Inbox Widget */}
                <div className="bg-white border border-ink-border rounded-sm shadow-sm overflow-hidden">
                    <div className="bg-ink text-ivory p-4 flex justify-between items-center">
                        <h3 className="text-sm font-bold uppercase tracking-wider">Inbox</h3>
                        <span className="bg-alert-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full">2</span>
                    </div>
                    <div className="divide-y divide-ink-border">
                        <div className="p-4 hover:bg-ivory cursor-pointer transition-colors group">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-bold uppercase text-ink-blue">Invitation</span>
                                <span className="text-[10px] text-ink/50 font-mono">10:05</span>
                            </div>
                            <p className="text-sm font-semibold group-hover:text-ink-blue transition-colors">Réunion bilatérale requise</p>
                            <p className="text-xs text-ink/70 mt-1">La délégation Européenne sollicite un entretien vidéo concernant la résolution Arctique.</p>
                            <div className="flex gap-2 mt-3">
                                <button className="flex-1 bg-ink text-ivory text-xs font-bold py-1.5 rounded-sm hover:bg-ink-blue">Accepter</button>
                                <button className="flex-1 bg-ink-border text-ink text-xs font-bold py-1.5 rounded-sm hover:bg-zinc-300">Décliner</button>
                            </div>
                        </div>
                        <div className="p-4 hover:bg-ivory cursor-pointer transition-colors group">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-bold uppercase text-ink">Système</span>
                                <span className="text-[10px] text-ink/50 font-mono">Hier</span>
                            </div>
                            <p className="text-sm font-semibold group-hover:text-ink-blue transition-colors">Stance approuvée</p>
                            <p className="text-xs text-ink/70 mt-1">Les Leaders ont validé votre draft de position paper V1.2.</p>
                        </div>
                    </div>
                </div>

                {/* Upcoming Deadlines Widget */}
                <div className="bg-ivory border border-ink-border rounded-sm shadow-sm overflow-hidden">
                    <div className="border-b border-ink-border p-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-ink/60">Upcoming Deadlines</h3>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center justify-center bg-white border border-alert-red/30 w-10 h-11 rounded-sm shadow-sm">
                                <span className="text-[10px] font-bold text-alert-red uppercase">FEV</span>
                                <span className="text-sm font-bold text-ink leading-none">23</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-ink">Fermeture des Votes</h4>
                                <p className="text-xs text-ink/60 mt-0.5">La Résolution sur le Climat clôture à 14h00.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center justify-center bg-white border border-ink-border w-10 h-11 rounded-sm shadow-sm">
                                <span className="text-[10px] font-bold text-ink/50 uppercase">FEV</span>
                                <span className="text-sm font-bold text-ink leading-none">24</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-ink">Comité de Rédaction</h4>
                                <p className="text-xs text-ink/60 mt-0.5">Dépôt final des amendements.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
