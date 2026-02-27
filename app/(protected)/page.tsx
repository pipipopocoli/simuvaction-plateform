import Link from "next/link";
import { DateTime } from "luxon";
import {
  Calendar,
  ChevronRight,
  Globe2,
  Megaphone,
  Newspaper,
  Plus,
  Siren,
  Vote,
} from "lucide-react";
import { FrontPageNewsFeed } from "@/components/newsroom/front-page-news-feed";
import { getUserSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import {
  ActionButton,
  ListCard,
  MapOverlayChip,
  PageShell,
  Panel,
  SectionHeader,
  StatTile,
  StatusBadge,
  TimelineItem,
} from "@/components/ui/commons";

function formatClock(date: Date | null) {
  if (!date) {
    return "TBD";
  }

  return DateTime.fromJSDate(date).toUTC().toFormat("HH:mm 'UTC'");
}

export default async function FrontPage() {
  const session = await getUserSession();
  if (!session) {
    return null;
  }

  const [recentNews, activeVotes, deadlines, nextMeeting] = await Promise.all([
    prisma.newsPost.findMany({
      where: { eventId: session.eventId, status: "published" },
      include: { author: { select: { name: true } } },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    prisma.vote.findMany({
      where: { eventId: session.eventId, status: "active" },
      include: { _count: { select: { ballots: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.officialDeadline.findMany({
      orderBy: { orderIndex: "asc" },
      take: 4,
    }),
    prisma.meeting.findFirst({
      where: { datetimeCet: { gte: new Date() } },
      orderBy: { datetimeCet: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="SimuVaction Commons"
        title="Live Briefing"
        subtitle="Global posture, active votes, and newsroom signals in one command view."
        actions={
          <StatusBadge tone="live" className="gap-2">
            LIVE
          </StatusBadge>
        }
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <PageShell className="xl:col-span-9">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/60">Global Activity Map</p>
              <StatusBadge tone={activeVotes.length > 0 ? "alert" : "neutral"}>
                {activeVotes.length > 0 ? `${activeVotes.length} open vote` : "No open vote"}
              </StatusBadge>
            </div>

            <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-ink-border bg-slate-100">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-75"
                style={{
                  backgroundImage:
                    "url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#f9fbff]/65 via-white/35 to-[#f8f3ec]/65" />

              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <MapOverlayChip tone="alert" icon={<Vote className="h-3.5 w-3.5" />} label={activeVotes[0]?.title ?? "Security Council vote"} />
                <MapOverlayChip tone="accent" icon={<Calendar className="h-3.5 w-3.5" />} label={nextMeeting ? `Next briefing ${formatClock(nextMeeting.datetimeCet)}` : "No meeting scheduled"} />
                <MapOverlayChip icon={<Megaphone className="h-3.5 w-3.5" />} label="Press coordination channel active" />
              </div>

              <div className="absolute bottom-4 left-4 right-4 grid gap-3 md:grid-cols-3">
                {activeVotes.slice(0, 3).map((voteItem) => (
                  <Panel key={voteItem.id} className="bg-white/95 p-3" variant="soft">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/55">Vote Open</p>
                    <p className="mt-1 line-clamp-2 font-serif text-lg font-bold text-ink">{voteItem.title}</p>
                    <p className="mt-2 text-xs text-ink/60">{voteItem._count.ballots} ballots submitted</p>
                  </Panel>
                ))}
                {activeVotes.length === 0 ? (
                  <Panel className="md:col-span-3" variant="soft">
                    <p className="text-sm text-ink/70">No active vote right now. The floor is in negotiation mode.</p>
                  </Panel>
                ) : null}
              </div>
            </div>
          </div>
        </PageShell>

        <Panel className="xl:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-serif text-3xl font-bold text-ink">
              <Siren className="h-6 w-6 text-alert-red" /> Breaking
            </h2>
            <Link href="/newsroom" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-blue hover:underline">
              See all
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentNews.map((post, index) => {
              const date = post.publishedAt ?? post.createdAt;
              return (
                <ListCard
                  key={post.id}
                  title={post.title}
                  description={post.body.slice(0, 130)}
                  meta={`${formatClock(date)} • ${post.author.name}`}
                  aside={index === 0 ? <StatusBadge tone="alert">Breaking</StatusBadge> : <StatusBadge tone="neutral">News</StatusBadge>}
                  className="p-3"
                />
              );
            })}
            {recentNews.length === 0 ? <p className="text-sm text-ink/65">No published article yet.</p> : null}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <PageShell className="xl:col-span-9">
          <SectionHeader title="Upcoming Events" subtitle="Deadlines and checkpoints for this simulation cycle." />
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {deadlines.map((deadline, index) => (
              <Panel key={deadline.id} className="p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/55">Checkpoint {index + 1}</p>
                <p className="mt-1 font-serif text-xl font-bold text-ink">{deadline.title}</p>
                <p className="mt-2 text-xs text-ink/65">{DateTime.fromJSDate(deadline.datetimeCet).toUTC().toFormat("dd LLL yyyy HH:mm 'UTC'")}</p>
              </Panel>
            ))}
          </div>
        </PageShell>

        <Panel className="xl:col-span-3">
          <h2 className="font-serif text-3xl font-bold text-ink">Quick Actions</h2>
          <div className="mt-4 space-y-3">
            {session.role === "admin" && (
              <Link href="/workspace/admin" className="block">
                <ActionButton className="w-full justify-between bg-red-700 text-white hover:bg-red-800">
                  Professor Admin Portal
                  <ChevronRight className="h-4 w-4" />
                </ActionButton>
              </Link>
            )}
            {(session.role === "leader" || session.role === "admin") && (
              <Link href="/votes" className="block">
                <ActionButton className="w-full justify-between">
                  Create Vote
                  <ChevronRight className="h-4 w-4" />
                </ActionButton>
              </Link>
            )}
            {(session.role === "journalist" || session.role === "admin") && (
              <Link href="/newsroom" className="block">
                <ActionButton variant="secondary" className="w-full justify-between">
                  Submit Article
                  <ChevronRight className="h-4 w-4" />
                </ActionButton>
              </Link>
            )}
            <Link href="/chat" className="block">
              <ActionButton variant="secondary" className="w-full justify-between">
                Open Messages
                <ChevronRight className="h-4 w-4" />
              </ActionButton>
            </Link>
            <ActionButton variant="ghost" className="w-full justify-between">
              Request Meeting
              <Plus className="h-4 w-4" />
            </ActionButton>
          </div>

          <div className="mt-6 space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/55">My Agenda</h3>
            <TimelineItem time="Today" title="Security Council Vote" details="Assembly chamber" tone="alert" />
            <TimelineItem time="Today" title="Bilateral Negotiation" details="Private room" tone="accent" />
            <TimelineItem time="Tomorrow" title="Press briefing cycle" details="Newsroom desk" />
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-9">
          <FrontPageNewsFeed />
        </div>

        <Panel className="xl:col-span-3">
          <h2 className="flex items-center gap-2 font-serif text-3xl font-bold text-ink">
            <Globe2 className="h-6 w-6 text-ink-blue" /> Situation Snapshot
          </h2>
          <div className="mt-4 grid gap-3">
            <StatTile label="Published News" value={recentNews.length} hint="Latest validated dispatches" />
            <StatTile label="Active Votes" value={activeVotes.length} tone={activeVotes.length > 0 ? "alert" : "default"} hint="Live parliamentary decisions" />
            <StatTile label="Role" value={session.role.toUpperCase()} tone="accent" hint="Current access profile" />
          </div>
          <Link href="/atlas" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink-blue hover:underline">
            Open full atlas view
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Panel>
      </div>

      <Panel className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/55">Operational footer</p>
          <p className="mt-1 text-sm text-ink/70">The legacy project is frozen. Commons updates deploy only to simulvaction-plateforme.</p>
        </div>
        <Link href="/archive" className="inline-flex items-center gap-2 rounded-lg border border-ink-border bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-ink-blue hover:text-ink-blue">
          <Newspaper className="h-4 w-4" />
          Open Archive
        </Link>
      </Panel>
    </div>
  );
}
