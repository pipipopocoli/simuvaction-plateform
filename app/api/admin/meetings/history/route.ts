import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import { isAdminLike } from "@/lib/authz";

export async function GET() {
  const session = await getUserSession();
  if (!session || !isAdminLike(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [meetingSessions, pressConferences] = await Promise.all([
    prisma.meetingSession.findMany({
      where: { eventId: session.eventId },
      include: {
        organizer: { select: { id: true, name: true, role: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
        },
        chatRoom: { select: { id: true, name: true, roomType: true } },
      },
      orderBy: [{ scheduledStartAt: "desc" }],
    }),
    prisma.pressConference.findMany({
      where: { eventId: session.eventId },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
        },
      },
      orderBy: [{ scheduledStartAt: "desc" }],
    }),
  ]);

  return NextResponse.json({
    meetings: meetingSessions.map((sessionItem) => ({
      id: sessionItem.id,
      title: sessionItem.title,
      status: sessionItem.status,
      scheduledStartAt: sessionItem.scheduledStartAt.toISOString(),
      scheduledEndAt: sessionItem.scheduledEndAt.toISOString(),
      organizer: sessionItem.organizer,
      googleMeetUrl: sessionItem.googleMeetUrl,
      chatRoom: sessionItem.chatRoom,
      participants: sessionItem.participants.map((participant) => ({
        id: participant.user.id,
        name: participant.user.name,
        role: participant.user.role,
        sessionRole: participant.role,
      })),
    })),
    pressConferences: pressConferences.map((conference) => ({
      id: conference.id,
      title: conference.title,
      status: conference.status,
      scheduledStartAt: conference.scheduledStartAt.toISOString(),
      scheduledEndAt: conference.scheduledEndAt.toISOString(),
      createdBy: conference.createdBy,
      googleMeetUrl: conference.googleMeetUrl,
      speakers: conference.participants.map((participant) => ({
        id: participant.user.id,
        name: participant.user.name,
        role: participant.user.role,
        sessionRole: participant.role,
      })),
    })),
  });
}
