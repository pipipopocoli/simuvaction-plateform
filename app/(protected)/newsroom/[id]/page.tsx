import { DateTime } from "luxon";
import { notFound, redirect } from "next/navigation";
import { getUserSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { buildFixedWordSummary } from "@/lib/news-summary";
import { Panel, SectionHeader, StatusBadge } from "@/components/ui/commons";

type NewsroomArticlePageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(isoDate: Date) {
  return DateTime.fromJSDate(isoDate).toUTC().toFormat("dd LLL yyyy HH:mm 'UTC'");
}

export default async function NewsroomArticlePage({ params }: NewsroomArticlePageProps) {
  const session = await getUserSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const article = await prisma.newsPost.findUnique({
    where: { id, eventId: session.eventId },
    include: { author: { select: { name: true, role: true } } },
  });

  if (!article) {
    notFound();
  }

  if (article.status === "draft" && article.authorId !== session.userId) {
    notFound();
  }

  const summary50 = buildFixedWordSummary(article.body, 50);
  const summary100 = buildFixedWordSummary(article.body, 100);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Dispatch Detail"
        title={article.title}
        subtitle="Full article content with short and extended summaries."
      />

      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge tone={article.status === "published" ? "success" : "neutral"}>{article.status}</StatusBadge>
          <p className="text-xs uppercase tracking-[0.08em] text-ink/55">
            {formatDate(article.publishedAt ?? article.createdAt)} • {article.author.name}
          </p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-ink-border bg-ivory p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">50-word summary</p>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">{summary50}</p>
          </div>
          <div className="rounded-xl border border-ink-border bg-ivory p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">100-word summary</p>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">{summary100}</p>
          </div>
        </div>

        <article className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed text-ink/85">{article.body}</article>
      </Panel>
    </div>
  );
}
