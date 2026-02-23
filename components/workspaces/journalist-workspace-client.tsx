"use client";

import { useState, useEffect, useCallback } from "react";
import { DateTime } from "luxon";
import { Plus, Edit3, Trash2, CheckCircle } from "lucide-react";

type RolePayload = {
    userId: string;
    role: string | null;
    eventId: string;
    teamId: string | null;
};

type NewsPost = {
    id: string;
    title: string;
    body: string;
    status: "draft" | "submitted" | "published" | "rejected";
    createdAt: string;
    publishedAt: string | null;
    authorId: string;
    author: { name: string; role: string };
    stats: {
        journalistApprovals: number;
        leaderApprovals: number;
        rejections: number;
        requiredJournalists: number;
        requiredLeaders: number;
        canPublish: boolean;
    };
    hasUserVoted: boolean;
};

export function JournalistWorkspaceClient({ payload }: { payload: RolePayload }) {
    const [activeTab, setActiveTab] = useState<"drafts" | "queue" | "published">("drafts");
    const [news, setNews] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);

    // Composer State
    const [isEditing, setIsEditing] = useState(false);
    const [currentPostId, setCurrentPostId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");

    const fetchNews = useCallback(async () => {
        setLoading(true);
        let filter = "all";
        if (activeTab === "drafts") filter = "my_drafts";
        if (activeTab === "queue") filter = "review_queue";
        if (activeTab === "published") filter = "published";

        try {
            const res = await fetch(`/api/news?filter=${filter}`);
            if (res.ok) {
                setNews(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    const formatDate = (isoDate: string) =>
        DateTime.fromISO(isoDate).isValid
            ? DateTime.fromISO(isoDate).toFormat("dd LLL yyyy HH:mm")
            : "Unknown date";

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    const handleOpenComposer = (post?: NewsPost) => {
        if (post) {
            setCurrentPostId(post.id);
            setTitle(post.title);
            setBody(post.body);
        } else {
            setCurrentPostId(null);
            setTitle("");
            setBody("");
        }
        setIsEditing(true);
    };

    const handleSaveDraft = async (submitImmediately = false) => {
        const endpoint = currentPostId ? `/api/news/${currentPostId}` : "/api/news";
        const method = currentPostId ? "PATCH" : "POST";
        const status = submitImmediately ? "submitted" : "draft";

        try {
            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content: body, status })
            });
            if (res.ok) {
                setIsEditing(false);
                fetchNews();
            } else {
                alert("Failed to save article.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this article?")) return;
        try {
            await fetch(`/api/news/${id}`, { method: "DELETE" });
            fetchNews();
        } catch { }
    };

    const handleReview = async (id: string, decision: "approve" | "reject") => {
        try {
            await fetch(`/api/news/${id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision })
            });
            fetchNews();
        } catch { }
    };

    if (isEditing) {
        return (
            <div className="mx-auto max-w-4xl p-6">
                <div className="mb-6 flex items-center justify-between border-b border-zinc-200 pb-4">
                    <h1 className="text-2xl font-bold font-serif text-zinc-900">
                        {currentPostId ? "Edit article" : "New article"}
                    </h1>
                    <button onClick={() => setIsEditing(false)} className="text-sm font-medium text-zinc-500 hover:text-zinc-800">
                        Cancel and return
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold uppercase tracking-wider text-zinc-600 mb-2">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-xl font-bold p-3 border border-zinc-300 rounded focus:ring-2 focus:ring-blue-800 outline-none"
                            placeholder="Example: Growing tensions in Eastern Europe..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold uppercase tracking-wider text-zinc-600 mb-2">Body</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={15}
                            className="w-full p-4 border border-zinc-300 rounded font-serif text-lg leading-relaxed focus:ring-2 focus:ring-blue-800 outline-none"
                            placeholder="Write your dispatch here..."
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => handleSaveDraft(false)}
                            className="flex-1 rounded border border-zinc-300 bg-white px-4 py-3 text-sm font-bold uppercase tracking-wider text-zinc-800 hover:bg-zinc-50"
                        >
                            Save draft
                        </button>
                        <button
                            onClick={() => handleSaveDraft(true)}
                            disabled={!title || !body}
                            className="flex-1 rounded bg-black px-4 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50"
                        >
                            Submit for peer review
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl p-6">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-4">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-zinc-900">Newsroom Desk</h1>
                    <p className="mt-1 text-sm text-zinc-500">SimuVaction Press Agency • Journalist portal</p>
                </div>
                <button
                    onClick={() => handleOpenComposer()}
                    className="inline-flex items-center gap-2 rounded bg-blue-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800"
                >
                    <Plus className="h-4 w-4" /> New article
                </button>
            </div>

            <div className="mb-6 flex overflow-x-auto border-b border-zinc-200">
                <button
                    onClick={() => setActiveTab("drafts")}
                    className={`whitespace-nowrap px-4 py-2.5 text-sm font-semibold uppercase tracking-wider ${activeTab === "drafts" ? "border-b-2 border-blue-900 text-blue-900" : "text-zinc-500 hover:text-zinc-800"}`}
                >
                    My drafts
                </button>
                <button
                    onClick={() => setActiveTab("queue")}
                    className={`whitespace-nowrap px-4 py-2.5 text-sm font-semibold uppercase tracking-wider ${activeTab === "queue" ? "border-b-2 border-blue-900 text-blue-900" : "text-zinc-500 hover:text-zinc-800"}`}
                >
                    Review queue
                </button>
                <button
                    onClick={() => setActiveTab("published")}
                    className={`whitespace-nowrap px-4 py-2.5 text-sm font-semibold uppercase tracking-wider ${activeTab === "published" ? "border-b-2 border-blue-900 text-blue-900" : "text-zinc-500 hover:text-zinc-800"}`}
                >
                    Published archive
                </button>
            </div>

            {loading ? (
                <div className="py-12 text-center text-zinc-500">Loading dispatches...</div>
            ) : news.length === 0 ? (
                <div className="border-2 border-dashed border-zinc-200 p-12 text-center rounded">
                    <p className="font-serif text-lg text-zinc-600">No article in this section.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {news.map((item) => (
                        <div key={item.id} className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
                            <div className="mb-2 flex items-center justify-between">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider
                  ${item.status === 'published' ? 'bg-green-100 text-green-800' :
                                        item.status === 'submitted' ? 'bg-amber-100 text-amber-800' :
                                            item.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-zinc-100 text-zinc-800'}`}>
                                    {item.status}
                                </span>
                                <span className="text-xs text-zinc-400 font-mono">
                                    {formatDate(item.createdAt)}
                                </span>
                            </div>

                            <h3 className="mb-1 font-serif text-xl font-bold leading-tight text-zinc-900">{item.title}</h3>
                            <p className="mb-4 text-sm font-medium text-zinc-500">By {item.author.name}</p>

                            <p className="mb-6 line-clamp-3 text-sm text-zinc-700 font-serif leading-relaxed">
                                {item.body}
                            </p>

                            {/* Action Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-4">

                                {/* Review Stats */}
                                <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                                    <div className="flex items-center gap-1">
                                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                        <span>Journalists: {item.stats.journalistApprovals}/{item.stats.requiredJournalists}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                                        <span>Leadership: {item.stats.leaderApprovals}/{item.stats.requiredLeaders}</span>
                                    </div>
                                    {item.stats.rejections > 0 && (
                                        <span className="text-red-600 font-bold">{item.stats.rejections} Rejections</span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Draft Actions */}
                                    {(item.status === "draft" || item.status === "rejected") && item.authorId === payload.userId && (
                                        <>
                                            <button onClick={() => handleOpenComposer(item)} className="p-2 text-zinc-400 hover:text-blue-600 transition" title="Edit">
                                                <Edit3 className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-zinc-400 hover:text-red-600 transition" title="Delete">
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </>
                                    )}

                                    {/* Review Actions (Only for submitted articles from OTHER authors) */}
                                    {item.status === "submitted" && item.authorId !== payload.userId && !item.hasUserVoted && (
                                        <>
                                            <button onClick={() => handleReview(item.id, "reject")} className="rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition">
                                                Reject
                                            </button>
                                            <button onClick={() => handleReview(item.id, "approve")} className="rounded bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 transition">
                                                Approve
                                            </button>
                                        </>
                                    )}
                                    {item.hasUserVoted && (
                                        <span className="text-xs font-semibold text-zinc-400 bg-zinc-100 px-2 py-1 rounded">Vote recorded</span>
                                    )}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
