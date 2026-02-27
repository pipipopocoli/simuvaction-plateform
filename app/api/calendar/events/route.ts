import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [deadlines, meetings] = await Promise.all([
    prisma.officialDeadline.findMany({
      orderBy: { datetimeCet: "asc" },
    }),
    prisma.meetingRequest.findMany({
      where: {
        eventId: session.eventId,
        status: "accepted",
        OR: [{ requesterId: session.userId }, { targetUserId: session.userId }],
      },
      include: {
        requester: { select: { name: true } },
        targetUser: { select: { name: true } },
        chatRoom: { select: { id: true, name: true } },
      },
      orderBy: { scheduledStartAt: "asc" },
    }),
  ]);

  const events = [
    ...deadlines.map((deadline) => ({
      id: `deadline:${deadline.id}`,
      type: "deadline" as const,
      title: deadline.title,
      startsAt: deadline.datetimeCet,
      details: "Official schedule checkpoint",
      deepLink: null,
    })),
    ...meetings.map((meeting) => ({
      id: `meeting:${meeting.id}`,
      type: "meeting" as const,
      title: meeting.title,
      startsAt: meeting.scheduledStartAt ?? meeting.proposedStartAt,
      details: `${meeting.requester.name} <> ${meeting.targetUser.name}`,
      deepLink: meeting.chatRoomId ? `/chat/${meeting.chatRoomId}` : null,
    })),
  ].sort((left, right) => +new Date(left.startsAt) - +new Date(right.startsAt));

  return NextResponse.json({ events });
}
