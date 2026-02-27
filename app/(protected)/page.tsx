import { getUserSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { toAtlasDelegations } from "@/lib/atlas";
import { DashboardHub } from "@/components/dashboard/dashboard-hub";
import type { DashboardUpcomingEvent } from "@/components/dashboard/upcoming-events-drawer";

function appendAction(actionMap: Map<string, string[]>, teamId: string | null | undefined, action: string) {
  if (!teamId) {
    return;
  }

  const current = actionMap.get(teamId) ?? [];
  if (!current.includes(action)) {
    current.push(action);
  }
  actionMap.set(teamId, current.slice(0, 3));
}

function appendUserAction(actionMap: Map<string, string[]>, userId: string | null | undefined, action: string) {
  if (!userId) {
    return;
  }

  const current = actionMap.get(userId) ?? [];
  if (!current.includes(action)) {
    current.push(action);
  }
  actionMap.set(userId, current.slice(0, 3));
}

export default async function DashboardPage() {
  const session = await getUserSession();
  if (!session) {
    return null;
  }

  const [
    recentNews,
    activeVotes,
    eventDeadlines,
    officialDeadlines,
    teams,
    recentMeetings,
    recentTeamMessages,
    leadershipProfiles,
  ] = await Promise.all([
    prisma.newsPost.findMany({
      where: { eventId: session.eventId, status: "published" },
      include: { author: { select: { id: true, name: true, teamId: true } } },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 12,
    }),
    prisma.vote.findMany({
      where: { eventId: session.eventId, status: "active" },
      include: { _count: { select: { ballots: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.eventDeadline.findMany({
      where: { eventId: session.eventId },
      orderBy: { date: "asc" },
      take: 8,
    }),
    prisma.officialDeadline.findMany({
      orderBy: { orderIndex: "asc" },
      take: 8,
    }),
    prisma.team.findMany({
      where: { eventId: session.eventId },
      include: {
        _count: { select: { users: true } },
        users: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true,
            positionPaperSummary: true,
          },
          orderBy: [{ name: "asc" }],
          take: 2,
        },
      },
      orderBy: { countryName: "asc" },
    }),
    prisma.meetingRequest.findMany({
      where: { eventId: session.eventId },
      select: {
        title: true,
        status: true,
        requesterId: true,
        targetUserId: true,
        requesterTeamId: true,
        targetTeamId: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
    prisma.chatMessage.findMany({
      where: {
        eventId: session.eventId,
        room: { teamId: { not: null } },
      },
      select: {
        createdAt: true,
        room: { select: { teamId: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.user.findMany({
      where: {
        eventId: session.eventId,
        role: "leader",
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        positionPaperSummary: true,
        team: { select: { id: true, countryName: true } },
      },
      orderBy: [{ name: "asc" }],
      take: 8,
    }),
  ]);

  const leadershipIds = leadershipProfiles.map((profile) => profile.id);
  const leadershipNews =
    leadershipIds.length > 0
      ? await prisma.newsPost.findMany({
          where: { eventId: session.eventId, authorId: { in: leadershipIds } },
          select: { authorId: true, title: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : [];

  const teamActionMap = new Map<string, string[]>();
  for (const post of recentNews) {
    appendAction(teamActionMap, post.author.teamId, `Published: ${post.title}`);
  }

  for (const meeting of recentMeetings) {
    appendAction(teamActionMap, meeting.requesterTeamId, `Meeting ${meeting.status}: ${meeting.title}`);
    appendAction(teamActionMap, meeting.targetTeamId, `Meeting ${meeting.status}: ${meeting.title}`);
  }

  for (const message of recentTeamMessages) {
    appendAction(
      teamActionMap,
      message.room.teamId,
      `Message activity in ${message.room.name} (${message.createdAt.toISOString().slice(11, 16)} UTC)`,
    );
  }

  const userActionMap = new Map<string, string[]>();
  for (const meeting of recentMeetings) {
    appendUserAction(userActionMap, meeting.requesterId, `Sent meeting request: ${meeting.title}`);
    appendUserAction(userActionMap, meeting.targetUserId, `Received meeting request: ${meeting.title}`);
  }

  for (const post of leadershipNews) {
    appendUserAction(userActionMap, post.authorId, `Published article: ${post.title}`);
  }

  const teamsWithActions = teams.map((team) => ({
    ...team,
    latestActions: teamActionMap.get(team.id) ?? ["No recent tracked action."],
  }));

  const delegations = toAtlasDelegations(teamsWithActions);

  const upcomingEvents: DashboardUpcomingEvent[] =
    eventDeadlines.length > 0
      ? eventDeadlines.map((deadline) => ({
          id: deadline.id,
          title: deadline.title,
          startsAtIso: deadline.date.toISOString(),
          description: deadline.description,
          source: "event_deadline",
        }))
      : officialDeadlines.map((deadline) => ({
          id: deadline.id,
          title: deadline.title,
          startsAtIso: deadline.datetimeCet.toISOString(),
          description: null,
          source: "official_deadline",
        }));

  const leadershipCards = leadershipProfiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
    teamName: profile.team?.countryName ?? null,
    stance:
      profile.positionPaperSummary?.trim() ||
      `${profile.name} is coordinating strategic guidance across active delegations.`,
    latestActions: userActionMap.get(profile.id) ?? ["No recent tracked action."],
  }));

  return (
    <DashboardHub
      sessionRole={session.role}
      recentNews={recentNews.slice(0, 4).map((post) => ({
        id: post.id,
        title: post.title,
        body: post.body,
        authorName: post.author.name,
        publishedAtIso: (post.publishedAt ?? post.createdAt).toISOString(),
      }))}
      activeVotes={activeVotes.map((voteItem) => ({
        id: voteItem.id,
        title: voteItem.title,
        ballotCount: voteItem._count.ballots,
      }))}
      delegations={delegations}
      leadershipProfiles={leadershipCards}
      upcomingEvents={upcomingEvents.slice(0, 6)}
    />
  );
}
