import Link from "next/link";
import { DateTime } from "luxon";
import { Globe2, Newspaper, Siren } from "lucide-react";
import { FrontPageNewsFeed } from "@/components/newsroom/front-page-news-feed";
import { InteractiveGlobalMap } from "@/components/atlas/interactive-global-map";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { LiveWirePanel } from "@/components/dashboard/live-wire-panel";
import { getUserSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { toAtlasDelegations } from "@/lib/atlas";
import {
  ListCard,
  PageShell,
  Panel,
  SectionHeader,
  StatTile,
  StatusBadge,
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

  const [recentNews, activeVotes, deadlines, teams, leadershipProfiles] = await Promise.all([
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
    prisma.team.findMany({
      where: { eventId: session.eventId },
      include: { _count: { select: { users: true } } },
      orderBy: { countryName: "asc" },
    }),
    prisma.user.findMany({
      where: {
        eventId: session.eventId,
        role: "leader",
      },
      include: {
        team: { select: { countryName: true } },
      },
      orderBy: [{ name: "asc" }],
      take: 8,
    }),
  ]);

  const delegations = toAtlasDelegations(teams);
  const globalActors = delegations.filter((delegation) => delegation.kind === "actor");

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="SimuVaction 2026: AI & Education"
        title="Live Briefing"
        subtitle="Global posture, active votes, meetings, and newsroom signals in one command view."
        actions={
          <StatusBadge tone="live" className="gap-2">
            LIVE
          </StatusBadge>
        }
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <PageShell className="space-y-4 xl:col-span-9">
          <LiveWirePanel />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/60">Global Activity Map</p>
              <StatusBadge tone={activeVotes.length > 0 ? "alert" : "neutral"}>
                {activeVotes.length > 0 ? `${activeVotes.length} open vote` : "No open vote"}
              </StatusBadge>
            </div>

            <InteractiveGlobalMap delegations={delegations} />
          </div>
        </PageShell>

        <Panel className="xl:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-serif text-3xl font-bold text-ink">
              <Siren className="h-6 w-6 text-alert-red" /> Breaking
            </h2>
            <Link
              href="/newsroom"
              className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-blue hover:underline"
            >
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
                  aside={
                    index === 0 ? (
                      <StatusBadge tone="alert">Breaking</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">News</StatusBadge>
                    )
                  }
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/55">
                  Checkpoint {index + 1}
                </p>
                <p className="mt-1 font-serif text-xl font-bold text-ink">{deadline.title}</p>
                <p className="mt-2 text-xs text-ink/65">
                  {DateTime.fromJSDate(deadline.datetimeCet).toUTC().toFormat("dd LLL yyyy HH:mm 'UTC'")}
                </p>
              </Panel>
            ))}
          </div>
        </PageShell>

        <QuickActionsPanel role={session.role} />
      </div>

      <PageShell>
        <SectionHeader
          title="Leadership & Global Actors"
          subtitle="Delegation leadership profiles followed by non-state actors in the current event roster."
        />

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Leadership</p>
            <div className="mt-3 grid gap-3">
              {leadershipProfiles.length === 0 ? (
                <p className="text-sm text-ink/65">No leadership profile available.</p>
              ) : (
                leadershipProfiles.map((profile) => (
                  <div key={profile.id} className="rounded-lg border border-ink-border bg-white p-3">
                    <p className="font-semibold text-ink">{profile.name}</p>
                    <p className="text-xs uppercase tracking-[0.08em] text-ink/55">
                      {profile.role} {profile.team?.countryName ? `• ${profile.team.countryName}` : ""}
                    </p>
                    {profile.positionPaperSummary ? (
                      <p className="mt-2 text-sm text-ink/75">{profile.positionPaperSummary}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Global actors</p>
            <div className="mt-3 grid gap-3">
              {globalActors.length === 0 ? (
                <p className="text-sm text-ink/65">No global actor delegation found in this event.</p>
              ) : (
                globalActors.map((actor) => (
                  <div key={actor.id} className="rounded-lg border border-ink-border bg-ivory p-3">
                    <p className="font-semibold text-ink">{actor.name}</p>
                    <p className="mt-1 text-sm text-ink/75">{actor.stance}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      </PageShell>

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
            <StatTile
              label="Active Votes"
              value={activeVotes.length}
              tone={activeVotes.length > 0 ? "alert" : "default"}
              hint="Live parliamentary decisions"
            />
            <StatTile label="Role" value={session.role.toUpperCase()} tone="accent" hint="Current access profile" />
          </div>
          <Link href="/?focus=map" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink-blue hover:underline">
            Focus map view
          </Link>
        </Panel>
      </div>

      <Panel className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/55">Operational footer</p>
          <p className="mt-1 text-sm text-ink/70">SimuVaction 2026: The Impact of Artificial Intelligence in Education.</p>
        </div>
        <Link
          href="/archive"
          className="inline-flex items-center gap-2 rounded-lg border border-ink-border bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-ink-blue hover:text-ink-blue"
        >
          <Newspaper className="h-4 w-4" />
          Open Archive
        </Link>
      </Panel>
    </div>
  );
}
