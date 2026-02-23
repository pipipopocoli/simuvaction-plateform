import { DateTime } from "luxon";
import { ArchiveIcon, FileClock } from "lucide-react";
import { getUserSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { ListCard, Panel, SectionHeader, StatusBadge } from "@/components/ui/commons";

export default async function ArchivePage() {
  const session = await getUserSession();
  if (!session) {
    return null;
  }

  const [publishedNews, recentVotes] = await Promise.all([
    prisma.newsPost.findMany({
      where: { eventId: session.eventId, status: "published" },
      include: { author: { select: { name: true } } },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 12,
    }),
    prisma.vote.findMany({
      where: { eventId: session.eventId, status: { not: "active" } },
      include: { _count: { select: { ballots: true } } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Historical Records"
        title="Archive"
        subtitle="Searchable trace of validated news and completed parliamentary actions."
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <h2 className="mb-4 flex items-center gap-2 font-serif text-3xl font-bold text-ink">
            <ArchiveIcon className="h-6 w-6 text-ink-blue" /> Published News
          </h2>

          <div className="space-y-3">
            {publishedNews.map((item) => (
              <ListCard
                key={item.id}
                title={item.title}
                description={item.body.slice(0, 150)}
                meta={`${DateTime.fromJSDate(item.publishedAt ?? item.createdAt).toUTC().toFormat("dd LLL yyyy HH:mm 'UTC'")} • ${item.author.name}`}
                aside={<StatusBadge tone="success">Published</StatusBadge>}
              />
            ))}
            {publishedNews.length === 0 ? <p className="text-sm text-ink/70">No archived story yet.</p> : null}
          </div>
        </Panel>

        <Panel className="xl:col-span-5" variant="soft">
          <h2 className="mb-4 flex items-center gap-2 font-serif text-3xl font-bold text-ink">
            <FileClock className="h-6 w-6 text-alert-red" /> Vote History
          </h2>

          <div className="space-y-3">
            {recentVotes.map((voteItem) => (
              <ListCard
                key={voteItem.id}
                title={voteItem.title}
                description={voteItem.description ?? "No additional description"}
                meta={`${voteItem._count.ballots} ballots submitted`}
                aside={
                  <StatusBadge tone={voteItem.status === "closed" ? "success" : "neutral"}>
                    {voteItem.status}
                  </StatusBadge>
                }
              />
            ))}
            {recentVotes.length === 0 ? <p className="text-sm text-ink/70">No archived vote yet.</p> : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
