"use client";

import { useEffect, useState } from "react";
import { Send, User as UserIcon, Loader2, MessageCircle, Heart, Repeat2 } from "lucide-react";
import { DateTime } from "luxon";

type SocialPost = {
    id: string;
    body: string;
    likesCount: number;
    createdAt: string;
    author: {
        id: string;
        name: string;
        displayRole: string | null;
        avatarUrl: string | null;
    };
    team: {
        id: string;
        countryName: string;
        countryCode: string;
    } | null;
};

type SocialFeedProps = {
    limit?: number;
    allowPosting?: boolean;
};

export function SocialFeed({ limit = 50, allowPosting = true }: SocialFeedProps) {
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [body, setBody] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    async function fetchPosts() {
        try {
            const res = await fetch(`/api/social?limit=${limit}`);
            if (res.ok) {
                setPosts(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchPosts();
        const interval = setInterval(fetchPosts, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [limit]);

    async function handlePost(e: React.FormEvent) {
        e.preventDefault();
        if (!body.trim()) return;

        setIsPosting(true);
        try {
            const res = await fetch("/api/social", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ body }),
            });
            if (res.ok) {
                const newPost = await res.json();
                setPosts((prev) => [newPost, ...prev]);
                setBody("");
            }
        } finally {
            setIsPosting(false);
        }
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-xl border border-ink-border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink-border px-4 py-3 bg-zinc-50">
                <h2 className="font-serif text-lg font-bold text-ink">Live Feed</h2>
                <div className="flex items-center gap-1.5 rounded-full bg-blue-100 px-2 py-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Global</span>
                </div>
            </div>

            {/* Post Composer */}
            {allowPosting && (
                <div className="border-b border-ink-border bg-white p-4">
                    <form onSubmit={handlePost} className="relative">
                        <textarea
                            className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-3 pr-12 text-sm text-ink placeholder-zinc-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            rows={3}
                            placeholder="What's happening in your delegation?"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            maxLength={280}
                        />
                        <button
                            type="submit"
                            disabled={isPosting || !body.trim()}
                            className="absolute bottom-3 right-3 flex items-center justify-center rounded-full bg-blue-600 p-2 text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 -ml-0.5" />}
                        </button>
                    </form>
                    <div className="mt-2 text-right text-[10px] uppercase font-semibold text-zinc-400">
                        {body.length} / 280
                    </div>
                </div>
            )}

            {/* Feed Stream */}
            <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-0">
                {isLoading ? (
                    <div className="flex justify-center p-8 text-zinc-400">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-sm text-zinc-500">No posts yet. Start the conversation!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-ink-border">
                        {posts.map((post) => (
                            <div key={post.id} className="p-4 transition hover:bg-zinc-50">
                                <div className="flex gap-3">
                                    <div className="shrink-0">
                                        {post.author.avatarUrl ? (
                                            <img src={post.author.avatarUrl} alt={post.author.name} className="h-10 w-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="grid h-10 w-10 place-items-center rounded-full bg-zinc-200 text-zinc-600">
                                                <UserIcon className="h-5 w-5" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-ink truncate text-sm">{post.author.name}</p>
                                            {post.team && (
                                                <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600">
                                                    {post.team.countryCode}
                                                </span>
                                            )}
                                            <span className="text-xs text-zinc-400 shrink-0">
                                                · {DateTime.fromISO(post.createdAt).toRelative()}
                                            </span>
                                        </div>
                                        {post.author.displayRole && (
                                            <p className="text-[11px] text-zinc-500 mb-1">{post.author.displayRole}</p>
                                        )}
                                        <p className="mt-1 text-sm text-ink whitespace-pre-wrap leading-relaxed">{post.body}</p>

                                        {/* Interaction Bar */}
                                        <div className="mt-3 flex items-center gap-6 text-zinc-400">
                                            <button className="flex items-center gap-1.5 text-[11px] hover:text-blue-500 transition">
                                                <MessageCircle className="h-3.5 w-3.5" /> 0
                                            </button>
                                            <button className="flex items-center gap-1.5 text-[11px] hover:text-green-500 transition">
                                                <Repeat2 className="h-3.5 w-3.5" /> 0
                                            </button>
                                            <button className="flex items-center gap-1.5 text-[11px] hover:text-red-500 transition">
                                                <Heart className="h-3.5 w-3.5" /> {post.likesCount}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
