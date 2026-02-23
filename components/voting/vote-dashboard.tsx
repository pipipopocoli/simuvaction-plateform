"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Lock, Unlock, Users, Globe2 } from "lucide-react";

type VoteOption = { id: string; label: string };
type Vote = {
    id: string;
    title: string;
    description: string;
    status: string;
    visibility: "public" | "secret";
    ballotMode: "per_delegation" | "per_person";
    options: VoteOption[];
    isEligible: boolean;
    hasVoted: boolean;
    createdBy: { name: string; role: string };
    _count: { casts: number };
};

export function VoteDashboard({ currentUserId, currentUserRole }: { currentUserId: string, currentUserRole: string }) {
    const [votes, setVotes] = useState<Vote[]>([]);
    const [loading, setLoading] = useState(true);
    const [castingId, setCastingId] = useState<string | null>(null);

    const fetchVotes = async () => {
        try {
            const res = await fetch("/api/votes");
            if (res.ok) {
                const data = await res.json();
                setVotes(data);
            }
        } catch (error) {
            console.error("Failed to fetch votes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVotes();
        // Simple polling for live updates
        const interval = setInterval(fetchVotes, 10000);
        return () => clearInterval(interval);
    }, []);

    const castVote = async (voteId: string, optionId: string) => {
        setCastingId(voteId);
        try {
            const res = await fetch(`/api/votes/${voteId}/cast`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ optionId })
            });

            if (res.ok) {
                // Update local state instantly
                setVotes(votes.map(v => v.id === voteId ? { ...v, hasVoted: true, _count: { casts: v._count.casts + 1 } } : v));
            } else {
                const data = await res.json();
                alert(`Erreur: ${data.error}`);
            }
        } catch (error) {
            console.error("Vote error:", error);
        } finally {
            setCastingId(null);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-zinc-500 animate-pulse">Chargement des résolutions...</div>;
    }

    const activeVotes = votes.filter(v => v.status === "active");

    if (activeVotes.length === 0) {
        return (
            <div className="bg-zinc-950 border border-zinc-800 border-dashed rounded-lg p-12 text-center text-zinc-500">
                <Globe2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Aucune résolution n'est actuellement soumise au vote.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {activeVotes.map(vote => (
                <div key={vote.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 relative overflow-hidden group">

                    {/* Status Badge */}
                    <div className="absolute top-0 right-0 px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider border-b border-l border-blue-500/20 rounded-bl">
                        En Cours
                    </div>

                    <div className="mb-4 pr-24">
                        <h3 className="text-xl font-bold text-white mb-2">{vote.title}</h3>
                        {vote.description && <p className="text-sm text-zinc-400">{vote.description}</p>}
                    </div>

                    <div className="flex items-center gap-4 mb-6 text-xs text-zinc-500 uppercase tracking-wider font-medium">
                        <div className="flex items-center gap-1">
                            {vote.visibility === "secret" ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            {vote.visibility === "secret" ? "Scrutin Secret" : "Scrutin Public"}
                        </div>
                        <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {vote.ballotMode === "per_delegation" ? "1 Vote / Pays" : "1 Vote / Délégué"}
                        </div>
                        <div>
                            • {vote._count.casts} Bulletins Déposés
                        </div>
                    </div>

                    {!vote.isEligible ? (
                        <div className="bg-zinc-950 border border-zinc-800 rounded p-4 text-center text-sm text-zinc-500">
                            Vous n'êtes pas éligible pour participer à cette résolution.
                        </div>
                    ) : vote.hasVoted ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-4 text-center text-emerald-400 flex flex-col items-center justify-center gap-2">
                            <CheckCircle2 className="w-6 h-6" />
                            <span className="font-medium">Votre bulletin a été enregistré.</span>
                            {vote.ballotMode === "per_delegation" && <span className="text-xs opacity-75">La voix de votre délégation est scellée.</span>}
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {vote.options.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => castVote(vote.id, opt.id)}
                                    disabled={castingId === vote.id}
                                    className="relative flex items-center justify-between p-4 rounded-md border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-500 transition disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                                >
                                    <span className="text-white font-medium">{opt.label}</span>
                                    <div className="w-4 h-4 rounded-full border border-zinc-500 group-hover/btn:border-white transition flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-white opacity-0 group-hover/btn:opacity-100 transition" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
