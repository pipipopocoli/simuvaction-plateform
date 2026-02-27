"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { Newspaper } from "lucide-react";
import { ListCard, Panel, StatusBadge } from "@/components/ui/commons";
import { ArticlePreviewModal } from "@/components/newsroom/article-preview-modal";

type PublicNewsPost = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  source: string | null;
  publishedAt: string | null;
  createdAt: string;
  author: { name: string; role: string };
};

function toClock(isoDate: string | null, fallbackDate: string) {
  const date = isoDate ?? fallbackDate;
  const parsed = DateTime.fromISO(date);
  if (!parsed.isValid) {
    return "Unknown time";
  }

  return parsed.toUTC().toFormat("HH:mm 'UTC'");
}

export function FrontPageNewsFeed() {
  const [news, setNews] = useState<PublicNewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewArticleId, setPreviewArticleId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPublishedNews() {
      try {
        const response = await fetch("/api/news?filter=published");
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as PublicNewsPost[];
        setNews(payload);
      } catch (error) {
        console.error("Failed to fetch news feed:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPublishedNews();
    const interval = setInterval(fetchPublishedNews, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <p className="rounded-xl border border-ink-border bg-white p-8 text-center text-sm text-ink/55">Loading newsroom feed...</p>;
  }

  if (news.length === 0) {
    return (
      <Panel>
        <h2 className="flex items-center gap-2 font-serif text-3xl font-bold text-ink">
          <Newspaper className="h-6 w-6 text-ink-blue" /> Global Feed
        </h2>
        <p className="mt-3 text-sm text-ink/65">No official dispatch has been published yet.</p>
      </Panel>
    );
  }

  const [leadStory, ...otherStories] = news;

  return (
    <div className="space-y-4">
      <ArticlePreviewModal articleId={previewArticleId} onClose={() => setPreviewArticleId(null)} />

      <Panel className="border-t-4 border-t-ink-blue">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-serif text-3xl font-bold text-ink">
            <Newspaper className="h-6 w-6 text-ink-blue" /> Global Feed
          </h2>
          <StatusBadge tone="live">Live updates</StatusBadge>
        </div>

        <button type="button" onClick={() => setPreviewArticleId(leadStory.id)} className="block w-full text-left">
          {leadStory.imageUrl && (
            <div className="mb-4 h-64 w-full overflow-hidden rounded-lg bg-ink-border/30">
              <img src={leadStory.imageUrl} alt={leadStory.title} className="h-full w-full object-cover" />
            </div>
          )}
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/55">
            {toClock(leadStory.publishedAt, leadStory.createdAt)} • {leadStory.author.name}
          </p>
          <h3 className="mt-2 font-serif text-4xl font-bold leading-tight text-ink">{leadStory.title}</h3>

          <div className="mt-4 border-l-4 border-ink-border/50 pl-4 py-1 mb-4 bg-ink/5 pr-4 rounded-r-md">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50 group-hover:text-ink-blue transition-colors">By {leadStory.author.name} — {leadStory.author.role.toUpperCase()}</p>
            {leadStory.source && <p className="text-[10px] italic text-ink/40 mt-1">Source: {leadStory.source}</p>}
          </div>

          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink/80">{leadStory.body}</p>
        </button>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2">
        {otherStories.map((post) => (
          <button type="button" key={post.id} onClick={() => setPreviewArticleId(post.id)} className="text-left">
            <ListCard
              title={post.title}
              description={post.body.slice(0, 150) + "..."}
              meta={`${toClock(post.publishedAt, post.createdAt)} • By ${post.author.name} ${post.source ? `(Source: ${post.source})` : ""}`}
              aside={<StatusBadge tone="neutral">Dispatch</StatusBadge>}
              className="hover:border-ink-blue/40 transition"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
