"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { DateTime } from "luxon";
import { Plus, Edit3, Trash2, Newspaper, Twitter, FileText, Send, Pen } from "lucide-react";
import { TwitterFeedPanel } from "@/components/newsroom/twitter-feed-panel";
import { NotionWorkspace } from "@/components/workspace/notion-workspace";
import { Panel } from "@/components/ui/commons";
import { MeetingRequestsPanel } from "@/components/meetings/meeting-requests-panel";
import { AgendaPanel } from "@/components/meetings/agenda-panel";

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
};

type WorkspaceTab = "compose" | "archive" | "workspace" | "press";

export function JournalistWorkspaceClient({ payload }: { payload: RolePayload }) {
    const [activeTab, setActiveTab] = useState<WorkspaceTab>("compose");
    const [news, setNews] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);

    // Composer
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [currentPostId, setCurrentPostId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "published">("idle");

    const fetchNews = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/news?filter=my_drafts");
            if (res.ok) setNews(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchNews(); }, [fetchNews]);

    const formatDate = (iso: string) =>
        DateTime.fromISO(iso).isValid ? DateTime.fromISO(iso).toFormat("dd LLL yyyy HH:mm") : "";

    const resetComposer = () => {
        setCurrentPostId(null);
        setTitle("");
        setBody("");
        setSaveStatus("idle");
    };

    const handleSave = async (publish = false) => {
        if (!title.trim() || !body.trim()) return;
        setIsSaving(true);
        const endpoint = currentPostId ? `/api/news/${currentPostId}` : "/api/news";
        const method = currentPostId ? "PATCH" : "POST";
        // Journalists publish directly (no peer review) – status goes straight to "submitted" for leader final stamp, or skip directly to published per user request
        const status = publish ? "submitted" : "draft";
        try {
            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content: body, status }),
            });
            if (res.ok) {
                setSaveStatus(publish ? "published" : "saved");
                if (!currentPostId) {
                    const data = await res.json();
                    setCurrentPostId(data.id);
                }
                fetchNews();
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this article?")) return;
        await fetch(`/api/news/${id}`, { method: "DELETE" });
        fetchNews();
    };

    const openEdit = (post: NewsPost) => {
        setCurrentPostId(post.id);
        setTitle(post.title);
        setBody(post.body);
        setSaveStatus("idle");
        setActiveTab("compose");
    };

    const tabs: { id: WorkspaceTab; label: string; icon: ReactNode }[] = [
        { id: "compose", label: "Compose", icon: <Pen className="h-4 w-4" /> },
        { id: "archive", label: "My Articles", icon: <FileText className="h-4 w-4" /> },
        { id: "press", label: "Press Room", icon: <Newspaper className="h-4 w-4" /> },
        { id: "workspace", label: "Workspace", icon: <Twitter className="h-4 w-4" /> },
    ];

    return (
        <div className="grid gap-6 xl:grid-cols-12 p-4 xl:p-0">
            <div className="xl:col-span-8">
                <Panel>
                    <div className="mb-4 flex flex-wrap gap-1 border-b border-ink-border pb-3">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md transition ${activeTab === tab.id ? "bg-ink text-white" : "text-ink/55 hover:text-ink hover:bg-ink-border/30"
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* COMPOSE TAB */}
                    {activeTab === "compose" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
                                    <Pen className="h-6 w-6 text-ink-blue" />
                                    {currentPostId ? "Editing Article" : "New Article"}
                                </h2>
                                {currentPostId && (
                                    <button onClick={resetComposer} className="text-xs text-ink/40 hover:text-ink-blue">
                                        + New article
                                    </button>
                                )}
                            </div>
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Headline…"
                                className="w-full rounded-lg border border-ink-border bg-ivory px-4 py-3 font-serif text-xl font-bold text-ink outline-none focus:border-ink-blue"
                            />
                            <textarea
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                placeholder="Write your dispatch here. Use this space to report on events, announce positions, or cover press conferences…"
                                rows={14}
                                className="w-full rounded-lg border border-ink-border bg-ivory px-4 py-3 font-serif text-base leading-relaxed text-ink outline-none focus:border-ink-blue resize-none"
                            />
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleSave(false)}
                                    disabled={isSaving || !title || !body}
                                    className="rounded-lg border border-ink-border bg-white px-4 py-2 text-sm font-bold text-ink hover:bg-ivory transition disabled:opacity-40"
                                >
                                    Save Draft
                                </button>
                                <button
                                    onClick={() => handleSave(true)}
                                    disabled={isSaving || !title || !body}
                                    className="flex items-center gap-2 rounded-lg bg-ink px-5 py-2 text-sm font-bold text-white hover:bg-ink/90 transition disabled:opacity-40"
                                >
                                    <Send className="h-4 w-4" />
                                    {currentPostId ? "Submit for Publication" : "Publish Article"}
                                </button>
                                {saveStatus === "saved" && <span className="text-xs text-emerald-600 font-bold">Draft saved</span>}
                                {saveStatus === "published" && <span className="text-xs text-ink-blue font-bold">Submitted for publication!</span>}
                            </div>
                        </div>
                    )}

                    {/* ARCHIVE TAB */}
                    {activeTab === "archive" && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-serif text-2xl font-bold text-ink">My Articles</h2>
                                <button onClick={() => { resetComposer(); setActiveTab("compose"); }} className="flex items-center gap-1 text-xs font-bold text-ink-blue hover:underline">
                                    <Plus className="h-3.5 w-3.5" /> New article
                                </button>
                            </div>
                            {loading ? (
                                <p className="text-ink/50 italic text-sm">Loading your articles…</p>
                            ) : news.length === 0 ? (
                                <div className="py-12 text-center border-2 border-dashed border-ink-border rounded-xl">
                                    <Newspaper className="h-10 w-10 mx-auto mb-3 text-ink/20" />
                                    <p className="text-ink/50 font-serif">No articles yet. Start writing your first dispatch!</p>
                                    <button onClick={() => setActiveTab("compose")} className="mt-3 text-xs text-ink-blue hover:underline font-bold">Open Composer →</button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {news.map(item => (
                                        <div key={item.id} className="rounded-xl border border-ink-border bg-white p-4 flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${item.status === "published" ? "bg-emerald-100 text-emerald-700" :
                                                        item.status === "submitted" ? "bg-amber-100 text-amber-700" :
                                                            item.status === "rejected" ? "bg-red-100 text-red-700" :
                                                                "bg-zinc-100 text-zinc-500"
                                                        }`}>{item.status}</span>
                                                    <span className="text-xs text-ink/40 font-mono">{formatDate(item.createdAt)}</span>
                                                </div>
                                                <h3 className="font-serif font-bold text-ink line-clamp-1">{item.title}</h3>
                                                <p className="text-sm text-ink/60 line-clamp-2 mt-0.5">{item.body}</p>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {(item.status === "draft" || item.status === "rejected") && (
                                                    <button onClick={() => openEdit(item)} className="p-2 text-ink/30 hover:text-ink-blue transition">
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-ink/30 hover:text-alert-red transition">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PRESS ROOM TAB */}
                    {activeTab === "press" && (
                        <div className="space-y-4">
                            <h2 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
                                <Newspaper className="h-6 w-6 text-ink-blue" /> Press Room
                            </h2>
                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                                <p className="text-sm font-bold text-amber-800 mb-2">🎤 Press Conference</p>
                                <p className="text-sm text-ink/70">Request a bilateral interview with a delegation leader. Submit your article to the official SimuVaction press feed for public display.</p>
                            </div>
                            <p className="text-xs text-ink/40 italic">Press conference scheduling coming in next sprint.</p>
                        </div>
                    )}

                    {/* WORKSPACE TAB */}
                    {activeTab === "workspace" && <NotionWorkspace teamName="Newsroom" userId={payload.userId} workspaceKey="journalist" />}
                </Panel>
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-4 space-y-4">
                <MeetingRequestsPanel />

                <Panel variant="soft">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-ink-blue mb-1">Press Identity</p>
                    <p className="font-serif text-xl font-bold text-ink">{payload.role?.toUpperCase()}</p>
                    <p className="text-xs text-ink/50 mt-1">ID: {payload.userId.slice(0, 8)}…</p>
                </Panel>
                <TwitterFeedPanel hashtag="SimuVaction2026" />
                <AgendaPanel />
            </div>
        </div>
    );
}
