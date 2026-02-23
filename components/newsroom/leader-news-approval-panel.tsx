"use client";

import { useState, useEffect } from "react";
import { format } from "luxon";
import { CheckCircle, XCircle } from "lucide-react";

type NewsPost = {
    id: string;
    title: string;
    body: string;
    status: "draft" | "submitted" | "published" | "rejected";
    createdAt: string;
    author: { name: string; role: string };
    stats: {
        journalistApprovals: number;
        leaderApprovals: number;
        requiredJournalists: number;
        requiredLeaders: number;
        canPublish: boolean;
    };
    hasUserVoted: boolean;
};

export function LeaderNewsApprovalPanel({ userId }: { userId: string }) {
    const [news, setNews] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/news?filter=review_queue");
            if (res.ok) {
                setNews(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const handleReview = async (id: string, decision: "approve" | "reject") => {
        if (decision === "reject" && !confirm("Voulez-vous vraiment rejeter cet article ? Il sera renvoyé à l'auteur.")) return;

        try {
            await fetch(`/api/news/${id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision })
            });
            fetchQueue();
        } catch (err) { }
    };

    if (loading) {
        return <div className="p-12 text-center text-zinc-500 font-medium">Chargement de la file d'attente...</div>;
    }

    if (news.length === 0) {
        return (
            <div className="border border-zinc-200 bg-zinc-50 p-12 text-center rounded-sm">
                <h3 className="font-serif text-xl font-bold text-zinc-800 mb-2">Aucun article en attente</h3>
                <p className="text-sm text-zinc-500">Toutes les dépêches ont été traitées ou aucune n'a été soumise par les journalistes.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-6">
            {news.map((item) => (
                <div key={item.id} className="rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">

                    <div className="mb-4 flex items-start justify-between">
                        <div>
                            <h3 className="font-serif text-2xl font-bold leading-tight text-zinc-900 mb-1">{item.title}</h3>
                            <p className="text-sm font-medium text-zinc-500">
                                Soumis par {item.author.name} • {format(new Date(item.createdAt), "dd MMM yyyy à HH:mm")}
                            </p>
                        </div>

                        {/* Status Badge */}
                        <div className="flex flex-col items-end gap-2">
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800">
                                En Révision
                            </span>

                            <div className="flex items-center gap-3 text-xs font-semibold">
                                <span className={item.stats.journalistApprovals >= item.stats.requiredJournalists ? "text-green-600" : "text-amber-600"}>
                                    Journalistes: {item.stats.journalistApprovals}/{item.stats.requiredJournalists}
                                </span>
                                <span className={item.stats.leaderApprovals >= item.stats.requiredLeaders ? "text-green-600" : "text-amber-600"}>
                                    Haut Cmd: {item.stats.leaderApprovals}/{item.stats.requiredLeaders}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 rounded bg-zinc-50 p-4 border border-zinc-100">
                        <p className="whitespace-pre-wrap font-serif text-base leading-relaxed text-zinc-800">
                            {item.body}
                        </p>
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-between border-t border-zinc-100 pt-4">

                        <p className="text-sm text-zinc-500">
                            {item.stats.journalistApprovals < item.stats.requiredJournalists
                                ? "⚠️ Cet article n'a pas encore reçu l'approbation de 2 journalistes."
                                : "✅ Les journalistes ont approuvé. En attente de votre validation finale."}
                        </p>

                        <div className="flex gap-3">
                            {item.hasUserVoted ? (
                                <span className="inline-flex items-center gap-2 rounded bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-500">
                                    <CheckCircle className="h-4 w-4" /> Vote Enregistré
                                </span>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleReview(item.id, "reject")}
                                        className="flex items-center gap-2 rounded border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition"
                                    >
                                        <XCircle className="h-4 w-4" /> Rejeter
                                    </button>
                                    <button
                                        onClick={() => handleReview(item.id, "approve")}
                                        disabled={item.stats.journalistApprovals < item.stats.requiredJournalists}
                                        className="flex items-center gap-2 rounded bg-blue-900 px-5 py-2 text-sm font-bold text-white hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={item.stats.journalistApprovals < item.stats.requiredJournalists ? "Nécessite d'abord 2 votes journalistes" : "Publier l'article"}
                                    >
                                        <CheckCircle className="h-4 w-4" /> Approuver & Publier
                                    </button>
                                </>
                            )}
                        </div>

                    </div>
                </div>
            ))}
        </div>
    );
}
