"use client";

import { useState, useEffect } from "react";
import { Search, PenTool } from "lucide-react";

type TeamDraft = {
    id: string;
    countryCode: string;
    countryName: string;
    declarationDraft: string | null;
};

function countryCodeToFlag(code: string) {
    if (!/^[A-Z]{2}$/.test(code)) {
        return "🌐";
    }
    return String.fromCodePoint(...[...code].map((char) => 127397 + char.charCodeAt(0)));
}

export function GameMasterDraftMonitor() {
    const [teams, setTeams] = useState<TeamDraft[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAllDrafts = async () => {
            try {
                const res = await fetch("/api/admin/drafts");
                const data = await res.json();
                if (!data.error) {
                    setTeams(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllDrafts();
        // Poll every 10 seconds to keep Game Master updated live
        const interval = setInterval(fetchAllDrafts, 10000);
        return () => clearInterval(interval);
    }, []);

    const filteredTeams = teams.filter((team) =>
        team.countryName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-ink-border bg-white px-3 py-2">
                <Search className="h-4 w-4 text-ink/50" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for a specific delegation..."
                    className="w-full bg-transparent text-sm outline-none text-ink"
                />
            </div>

            {isLoading ? (
                <div className="py-12 text-center text-ink/50 italic text-sm">Loading delegation drafts...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredTeams.map((team) => (
                        <div key={team.id} className="border border-ink-border rounded bg-white overflow-hidden flex flex-col h-64">
                            <div className="bg-ink-blue/5 border-b border-ink-border px-3 py-2 flex items-center justify-between">
                                <span className="font-bold text-ink flex items-center gap-2">
                                    <span className="text-xl leading-none">{countryCodeToFlag(team.countryCode)}</span>
                                    {team.countryName}
                                </span>
                                <span className="text-[10px] text-ink/50 uppercase tracking-widest font-mono">
                                    {team.declarationDraft ? `${team.declarationDraft.length} chars` : "Empty"}
                                </span>
                            </div>
                            <div className="p-3 flex-1 overflow-y-auto bg-slate-50/50">
                                {team.declarationDraft ? (
                                    <p className="font-serif text-sm text-ink leading-relaxed whitespace-pre-wrap">
                                        {team.declarationDraft}
                                    </p>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-ink/40 gap-2">
                                        <PenTool className="h-6 w-6" />
                                        <span className="text-xs italic">No draft started yet.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredTeams.length === 0 && (
                        <div className="md:col-span-2 py-8 text-center text-ink/50 italic text-sm">
                            No delegations match your search.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
