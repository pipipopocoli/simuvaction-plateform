"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { X } from "lucide-react";

type ArticlePreviewPayload = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  publishedAt: string | null;
  author: { name: string; role: string };
  summary50: string;
  summary100: string;
};

type ArticlePreviewModalProps = {
  articleId: string | null;
  onClose: () => void;
};

function formatDate(iso: string) {
  const parsed = DateTime.fromISO(iso);
  if (!parsed.isValid) {
    return "Unknown date";
  }

  return parsed.toUTC().toFormat("dd LLL yyyy HH:mm 'UTC'");
}

export function ArticlePreviewModal({ articleId, onClose }: ArticlePreviewModalProps) {
  const [state, setState] = useState<{
    loadedId: string | null;
    article: ArticlePreviewPayload | null;
  }>({
    loadedId: null,
    article: null,
  });

  useEffect(() => {
    if (!articleId) {
      return;
    }

    let active = true;

    fetch(`/api/news/${articleId}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (active) {
          setState({
            loadedId: articleId,
            article: payload as ArticlePreviewPayload | null,
          });
        }
      })
      .catch(() => {
        if (active) {
          setState({ loadedId: articleId, article: null });
        }
      });

    return () => {
      active = false;
    };
  }, [articleId]);

  if (!articleId) {
    return null;
  }

  const isLoading = state.loadedId !== articleId;
  const article = state.loadedId === articleId ? state.article : null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-ink-border bg-[var(--color-surface)] p-5 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-ink/55 hover:bg-ink/10 hover:text-ink"
          aria-label="Close article preview"
        >
          <X className="h-4 w-4" />
        </button>

        {isLoading ? (
          <p className="text-sm text-ink/70">Loading article preview...</p>
        ) : !article ? (
          <p className="text-sm text-ink/70">Unable to load this article preview.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.1em] text-ink/55">
              {formatDate(article.publishedAt ?? article.createdAt)} • {article.author.name}
            </p>
            <h2 className="font-serif text-4xl font-bold text-ink">{article.title}</h2>

            <div className="rounded-xl border border-ink-border bg-ivory p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">50-word summary</p>
              <p className="mt-2 text-sm text-ink/80">{article.summary50}</p>
            </div>

            <div className="rounded-xl border border-ink-border bg-ivory p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">100-word summary</p>
              <p className="mt-2 text-sm text-ink/80">{article.summary100}</p>
            </div>

            <div className="rounded-xl border border-ink-border bg-[var(--color-surface)] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Article extract</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink/85">
                {article.body.slice(0, 900)}
                {article.body.length > 900 ? "..." : ""}
              </p>
            </div>

            <div className="flex justify-end">
              <Link
                href={`/newsroom/${article.id}`}
                className="inline-flex items-center rounded-lg bg-ink-blue px-4 py-2 text-sm font-semibold text-white hover:bg-ink-blue-hover"
              >
                Open full article
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
