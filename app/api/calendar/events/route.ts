import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import { isAdminLike } from "@/lib/authz";

type CalendarEventPayload = {
  id: string;
  type: "deadline" | "meeting" | "press_conference";
  title: string;
  startsAt: string;
  endsAt?: string;
  details: string;
  deepLink: string | null;
  visibilityScope: "global" | "personal" | "team";
  source: "event_deadline" | "official_deadline" | "meeting_request" | "press_conference";
};

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meetingWhere = isAdminLike(session.role)
    ? { eventId: session.eventId, status: "accepted" as const }
    : {
        eventId: session.eventId,
        status: "accepted" as const,
        OR: [
          { requesterId: session.userId },
          { targetUserId: session.userId },
          { attendeeUserIds: { has: session.userId } },
          ...(session.teamId
            ? [{ requesterTeamId: session.teamId }, { targetTeamId: session.teamId }]
            : []),
        ],
      };

  const [eventDeadlines, officialDeadlines, meetings, pressConferences] = await Promise.all([
    prisma.eventDeadline.findMany({
      where: { eventId: session.eventId },
      orderBy: { date: "asc" },
      take: 80,
    }),
    prisma.officialDeadline.findMany({
      orderBy: { datetimeCet: "asc" },
      take: 80,
    }),
    prisma.meetingRequest.findMany({
      where: meetingWhere,
      include: {
        requester: { select: { id: true, name: true } },
        targetUser: { select: { id: true, name: true } },
        chatRoom: { select: { id: true, name: true } },
        meetingSession: { select: { id: true } },
      },
      orderBy: { scheduledStartAt: "asc" },
      take: 120,
    }),
    prisma.pressConference.findMany({
      where: { eventId: session.eventId, status: { not: "cancelled" } },
      orderBy: { scheduledStartAt: "asc" },
      take: 120,
    }),
  ]);

  const deadlineEvents: CalendarEventPayload[] =
    eventDeadlines.length > 0
      ? eventDeadlines.map((deadline) => ({
          id: `deadline:${deadline.id}`,
          type: "deadline",
          title: deadline.title,
          startsAt: deadline.date.toISOString(),
          details: deadline.description?.trim() || "Official event deadline",
          deepLink: "/workspace",
          visibilityScope: deadline.isGlobal ? "global" : "personal",
          source: "event_deadline",
        }))
      : officialDeadlines.map((deadline) => ({
          id: `official:${deadline.id}`,
          type: "deadline",
          title: deadline.title,
          startsAt: deadline.datetimeCet.toISOString(),
          details: "Official schedule checkpoint",
          deepLink: "/workspace",
          visibilityScope: "global",
          source: "official_deadline",
        }));

  const meetingEvents: CalendarEventPayload[] = meetings.map((meeting) => {
    const startsAt = meeting.scheduledStartAt ?? meeting.proposedStartAt;
    const endsAt = new Date(startsAt.getTime() + meeting.durationMin * 60_000);
    const visibilityScope =
      meeting.requesterId === session.userId ||
      meeting.targetUserId === session.userId ||
      meeting.attendeeUserIds.includes(session.userId)
        ? "personal"
        : "team";

    return {
      id: `meeting:${meeting.id}`,
      type: "meeting",
      title: meeting.title,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      details: `${meeting.requester.name} <> ${meeting.targetUser?.name ?? meeting.targetLabel ?? "group"}`,
      deepLink: meeting.meetingSession?.id ? `/meetings/${meeting.meetingSession.id}` : meeting.chatRoomId ? `/chat/${meeting.chatRoomId}` : null,
      visibilityScope,
      source: "meeting_request",
    };
  });

  const pressConferenceEvents: CalendarEventPayload[] = pressConferences.map((conference) => ({
    id: `press:${conference.id}`,
    type: "press_conference",
    title: conference.title,
    startsAt: conference.scheduledStartAt.toISOString(),
    endsAt: conference.scheduledEndAt.toISOString(),
    details: conference.description?.trim() || "Press conference",
    deepLink: `/press-conferences/${conference.id}`,
    visibilityScope: "global",
    source: "press_conference",
  }));

  const events = [...deadlineEvents, ...meetingEvents, ...pressConferenceEvents].sort(
    (left, right) => +new Date(left.startsAt) - +new Date(right.startsAt),
  );

  return NextResponse.json({ events });
}
