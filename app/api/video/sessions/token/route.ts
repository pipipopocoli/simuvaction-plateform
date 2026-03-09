import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";

const requestSchema = z.object({
  kind: z.enum(["meeting", "press"]),
  id: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.kind === "meeting") {
    const meetingSession = await prisma.meetingSession.findFirst({
      where: {
        id: parsed.data.id,
        eventId: session.eventId,
        participants: { some: { userId: session.userId } },
      },
      include: {
        participants: {
          where: { userId: session.userId },
          select: { role: true },
        },
      },
    });

    if (!meetingSession) {
      return NextResponse.json({ error: "Meeting video session not found." }, { status: 404 });
    }

    return NextResponse.json({
      roomName: meetingSession.videoRoomName,
      displayName: session.name,
      role: meetingSession.participants[0]?.role ?? "attendee",
      canPublishAudio: true,
      canPublishVideo: true,
      googleMeetUrl: meetingSession.googleMeetUrl,
      sessionType: "meeting",
    });
  }

  const pressConference = await prisma.pressConference.findFirst({
    where: {
      id: parsed.data.id,
      eventId: session.eventId,
    },
    include: {
      participants: {
        where: { userId: session.userId },
        select: { role: true },
      },
    },
  });

  if (!pressConference) {
    return NextResponse.json({ error: "Press conference not found." }, { status: 404 });
  }

  const participantRole = pressConference.participants[0]?.role ?? "audience";
  const isSpeaker = participantRole === "host" || participantRole === "speaker";

  return NextResponse.json({
    roomName: pressConference.videoRoomName,
    displayName: session.name,
    role: participantRole,
    canPublishAudio: isSpeaker,
    canPublishVideo: isSpeaker,
    googleMeetUrl: pressConference.googleMeetUrl,
    sessionType: "press",
  });
}
