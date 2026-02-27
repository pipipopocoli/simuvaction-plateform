"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { Globe2, Newspaper, Siren } from "lucide-react";
import type { AtlasDelegation } from "@/lib/atlas";
import { InteractiveGlobalMap } from "@/components/atlas/interactive-global-map";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { LiveWirePanel } from "@/components/dashboard/live-wire-panel";
import { FrontPageNewsFeed } from "@/components/newsroom/front-page-news-feed";
import { ArticlePreviewModal } from "@/components/newsroom/article-preview-modal";
import { UpcomingEventsDrawer, type DashboardUpcomingEvent } from "@/components/dashboard/upcoming-events-drawer";
import {
  ListCard,
  PageShell,
  Panel,
  SectionHeader,
  StatTile,
  StatusBadge,
} from "@/components/ui/commons";

type DashboardNewsItem = {
  id: string;
  title: string;
  body: string;
  authorName: string;
  publishedAtIso: string;
};

type DashboardVoteItem = {
  id: string;
  title: string;
  ballotCount: number;
};

type DashboardLeadershipProfile = {
  id: string;
  name: string;
  avatarUrl: string | null;
  teamName: string | null;
  stance: string;
  latestActions: string[];
};

type DashboardHubProps = {
  sessionRole: string;
  recentNews: DashboardNewsItem[];
  activeVotes: DashboardVoteItem[];
  delegations: AtlasDelegation[];
  leadershipProfiles: DashboardLeadershipProfile[];
  upcomingEvents: DashboardUpcomingEvent[];
};

type SelectionState =
  | { type: "delegation"; id: string }
  | { type: "leadership"; id: string }
  | null;

function formatClock(isoDate: string) {
  const parsed = DateTime.fromISO(isoDate);
  if (!parsed.isValid) {
    return "TBD";
  }

  return parsed.toUTC().toFormat("HH:mm 'UTC'");
}

export function DashboardHub({
  sessionRole,
  recentNews,
  activeVotes,
  delegations,
  leadershipProfiles,
  upcomingEvents,
}: DashboardHubProps) {
  const [selection, setSelection] = useState<SelectionState>(null);
  const [previewArticleId, setPreviewArticleId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const selectedDelegation = useMemo(() => {
    if (!selection || selection.type !== "delegation") {
      return null;
    }

    return delegations.find((delegation) => delegation.id === selection.id) ?? null;
  }, [delegations, selection]);

  const selectedLeadership = useMemo(() => {
    if (!selection || selection.type !== "leadership") {
      return null;
    }

    return leadershipProfiles.find((profile) => profile.id === selection.id) ?? null;
  }, [leadershipProfiles, selection]);

  const globalActors = useMemo(
    () => delegations.filter((delegation) => delegation.kind === "actor"),
    [delegations],
  );

  const selectedUpcomingEvent = useMemo(
    () => upcomingEvents.find((item) => item.id === selectedEventId) ?? null,
    [upcomingEvents, selectedEventId],
  );

  return (
    <div className="space-y-5">
      <ArticlePreviewModal articleId={previewArticleId} onClose={() => setPreviewArticleId(null)} />
      <UpcomingEventsDrawer event={selectedUpcomingEvent} onClose={() => setSelectedEventId(null)} />

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

      <div className="grid gap-5 xl:grid-cols-12">
        <PageShell className="space-y-3 xl:col-span-9">
          <LiveWirePanel />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/60">Global Activity Map</p>
              <StatusBadge tone={activeVotes.length > 0 ? "alert" : "neutral"}>
                {activeVotes.length > 0 ? `${activeVotes.length} open vote` : "No open vote"}
              </StatusBadge>
            </div>

            <InteractiveGlobalMap
              delegations={delegations}
              selectedDelegationId={selectedDelegation?.id ?? null}
              onSelectDelegation={(delegationId) =>
                setSelection(delegationId ? { type: "delegation", id: delegationId } : null)
              }
            />
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
            {recentNews.map((post, index) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setPreviewArticleId(post.id)}
                className="block w-full text-left"
              >
                <ListCard
                  title={post.title}
                  description={post.body.slice(0, 130)}
                  meta={`${formatClock(post.publishedAtIso)} • ${post.authorName}`}
                  aside={index === 0 ? <StatusBadge tone="alert">Breaking</StatusBadge> : <StatusBadge tone="neutral">News</StatusBadge>}
                  className="p-3 transition hover:border-ink-blue/40"
                />
              </button>
            ))}
            {recentNews.length === 0 ? <p className="text-sm text-ink/65">No published article yet.</p> : null}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <PageShell className="xl:col-span-9">
          <SectionHeader title="Upcoming Events" subtitle="Deadlines and checkpoints for this simulation cycle." />
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {upcomingEvents.map((event, index) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedEventId(event.id)}
                className="rounded-xl border border-ink-border bg-[var(--color-surface)] p-3 text-left shadow-sm transition hover:border-ink-blue/40"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/55">Checkpoint {index + 1}</p>
                <p className="mt-1 font-serif text-lg font-bold text-ink">{event.title}</p>
                <p className="mt-2 text-xs text-ink/65">
                  {DateTime.fromISO(event.startsAtIso).toUTC().toFormat("dd LLL yyyy HH:mm 'UTC'")}
                </p>
              </button>
            ))}
            {upcomingEvents.length === 0 ? (
              <p className="rounded-xl border border-ink-border bg-[var(--color-surface)] p-3 text-sm text-ink/65">
                No upcoming events for this cycle.
              </p>
            ) : null}
          </div>
        </PageShell>

        <QuickActionsPanel role={sessionRole} />
      </div>

      <PageShell>
        <SectionHeader
          title="Leadership & Global Actors"
          subtitle="Delegation leadership profiles followed by non-state actors in the current event roster."
        />

        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <Panel>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Leadership</p>
            <div className="mt-3 grid gap-3">
              {leadershipProfiles.length === 0 ? (
                <p className="text-sm text-ink/65">No leadership profile available.</p>
              ) : (
                leadershipProfiles.map((profile) => (
                  <button
                    type="button"
                    key={profile.id}
                    onClick={() => setSelection({ type: "leadership", id: profile.id })}
                    className="rounded-lg border border-ink-border bg-[var(--color-surface)] p-3 text-left transition hover:border-ink-blue/40"
                  >
                    <div className="flex items-center gap-2">
                      {profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={profile.name} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-ivory text-xs font-bold text-ink">
                          {profile.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <p className="font-semibold text-ink">{profile.name}</p>
                    </div>
                    {profile.teamName ? <p className="mt-1 text-xs uppercase tracking-[0.08em] text-ink/55">{profile.teamName}</p> : null}
                  </button>
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
                  <button
                    key={actor.id}
                    type="button"
                    onClick={() => setSelection({ type: "delegation", id: actor.id })}
                    className="rounded-lg border border-ink-border bg-ivory p-3 text-left transition hover:border-ink-blue/40"
                  >
                    <p className="font-semibold text-ink">{actor.name}</p>
                    <p className="mt-1 text-sm text-ink/75">{actor.stance}</p>
                  </button>
                ))
              )}
            </div>
          </Panel>

          <Panel variant="soft">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Profile detail</p>
            {selectedLeadership ? (
              <div className="mt-3 space-y-3">
                <h3 className="font-serif text-2xl font-bold text-ink">{selectedLeadership.name}</h3>
                <p className="text-sm text-ink/80">{selectedLeadership.stance}</p>
                <div className="rounded-lg border border-ink-border bg-[var(--color-surface)] p-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Latest actions</p>
                  <ul className="mt-2 space-y-1 text-sm text-ink/80">
                    {selectedLeadership.latestActions.map((action) => (
                      <li key={action}>• {action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : selectedDelegation ? (
              <div className="mt-3 space-y-3">
                <h3 className="font-serif text-2xl font-bold text-ink">
                  {selectedDelegation.flagEmoji} {selectedDelegation.name}
                </h3>
                <p className="text-sm text-ink/80">{selectedDelegation.stance}</p>
                <div className="rounded-lg border border-ink-border bg-[var(--color-surface)] p-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Latest actions</p>
                  <ul className="mt-2 space-y-1 text-sm text-ink/80">
                    {selectedDelegation.latestActions.map((action) => (
                      <li key={action}>• {action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink/65">
                Select a country pin, leadership member, or global actor to open the detailed profile.
              </p>
            )}
          </Panel>
        </div>
      </PageShell>

      <div className="grid gap-5 xl:grid-cols-12">
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
            <StatTile label="Role" value={sessionRole.toUpperCase()} tone="accent" hint="Current access profile" />
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
          className="inline-flex items-center gap-2 rounded-lg border border-ink-border bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-ink hover:border-ink-blue hover:text-ink-blue"
        >
          <Newspaper className="h-4 w-4" />
          Open Archive
        </Link>
      </Panel>
    </div>
  );
}
