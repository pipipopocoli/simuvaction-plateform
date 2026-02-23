"use client";

import { useState, useEffect } from "react";
import { format } from "luxon";
import { Newspaper } from "lucide-react";

type PublicNewsPost = {
    id: string;
    title: string;
    body: string;
    publishedAt: string;
    author: { name: string; role: string };
};

export function FrontPageNewsFeed() {
    const [news, setNews] = useState<PublicNewsPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPublishedNews = async () => {
            try {
                const res = await fetch("/api/news?filter=published");
                if (res.ok) {
                    const data = await res.json();
                    setNews(data);
                }
            } catch (err) {
                console.error("Failed to fetch news feed:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPublishedNews();

        // Poll every 15 seconds to simulate real-time news delivery
        const interval = setInterval(fetchPublishedNews, 15000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col h-full animate-pulse border-t-[8px] border-ink bg-white p-6 md:p-8 shadow-sm">
                <div className="h-6 w-1/3 bg-zinc-200 mb-6"></div>
                <div className="h-4 w-full bg-zinc-100 mb-2"></div>
                <div className="h-4 w-full bg-zinc-100 mb-2"></div>
                <div className="h-4 w-2/3 bg-zinc-100"></div>
            </div>
        );
    }

    if (news.length === 0) {
        return (
            <div className="flex flex-col h-full border-t-[8px] border-ink bg-white p-6 md:p-8 shadow-sm">
                <h2 className="mb-2 flex items-center gap-3 font-serif text-2xl md:text-3xl font-bold uppercase tracking-widest text-ink">
                    <Newspaper className="h-7 w-7 opacity-80" /> The Global Feed
                </h2>
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-ink/40">
                    <p className="font-serif text-lg italic mt-4 text-center">Aucune dépêche officielle n&apos;a encore franchi le comité éditorial.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full border-t-[8px] border-ink bg-white p-6 md:p-8 shadow-sm">
            <div className="mb-6 flex items-end justify-between border-b-2 border-ink pb-4">
                <h2 className="flex items-center gap-3 font-serif text-2xl md:text-3xl font-bold uppercase tracking-widest text-ink">
                    <Newspaper className="h-7 w-7" /> THE GLOBAL FEED
                </h2>
                <span className="text-xs font-bold uppercase tracking-widest text-alert-red animate-pulse flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-alert-red block"></span>
                    Live Updates
                </span>
            </div>

            <div className="flex flex-col divide-y divide-ink-border">
                {news.map((post, index) => (
                    <article key={post.id} className={`py-6 ${index === 0 ? "pt-0" : ""}`}>
                        <header className="mb-3">
                            <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink/60">
                                <span className="text-alert-red font-mono">
                                    {format(new Date(post.publishedAt || new Date()), "HH:mm 'EST'")}
                                </span>
                                <span>By {post.author.name}</span>
                            </div>
                            <h3 className="font-serif text-2xl md:text-3xl font-bold leading-tight text-ink hover:text-ink-blue transition-colors cursor-pointer">
                                {post.title}
                            </h3>
                        </header>
                        <div className="font-serif text-base md:text-lg leading-relaxed text-ink/80 whitespace-pre-wrap">
                            {post.body}
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
