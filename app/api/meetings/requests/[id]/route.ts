import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import { isAdminLike } from "@/lib/authz";
import { buildDirectPairKey, ensureRoomMemberships, uniqueIds } from "@/lib/communications";
import { createGoogleCalendarEventForUser } from "@/lib/google-calendar";
import { buildVideoRoomName } from "@/lib/video-room";

const decisionSchema = z.object({
  decision: z.enum(["accept", "decline", "cancel"]),
  scheduledStartAt: z.string().datetime().optional(),
  responseNote: z.string().trim().max(1000).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = decisionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = await params;
  const { decision, scheduledStartAt, responseNote } = parsed.data;

  const meetingRequest = await prisma.meetingRequest.findFirst({
    where: { id, eventId: session.eventId },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
          preferredTimeZone: true,
        },
      },
      targetUser: {
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
          preferredTimeZone: true,
        },
      },
      targetTeam: { select: { id: true, countryName: true } },
      chatRoom: { select: { id: true, name: true } },
      meetingSession: { select: { id: true, chatRoomId: true } },
    },
  });

  if (!meetingRequest) {
    return NextResponse.json({ error: "Meeting request not found." }, { status: 404 });
  }

  const attendeeIds = uniqueIds([
    ...meetingRequest.attendeeUserIds,
    meetingRequest.targetUserId,
  ]);
  const isRequester = meetingRequest.requesterId === session.userId;
  const isAttendee = attendeeIds.includes(session.userId);
  const isAdmin = isAdminLike(session.role);

  if (decision === "cancel") {
    if (!isRequester && !isAdmin) {
      return NextResponse.json({ error: "Only the requester can cancel this request." }, { status: 403 });
    }

    const cancelled = await prisma.meetingRequest.update({
      where: { id: meetingRequest.id },
      data: {
        status: "cancelled",
        responseNote: responseNote || null,
        respondedById: session.userId,
        respondedAt: new Date(),
      },
    });

    if (attendeeIds.length > 0) {
      await prisma.notification.createMany({
        data: attendeeIds.map((userId) => ({
          eventId: session.eventId,
          userId,
          type: "meeting_request_cancelled",
          title: "Meeting request cancelled",
          body: `${meetingRequest.requester.name} cancelled: ${meetingRequest.title}`,
          deepLink: "/dashboard",
          priority: "normal",
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ ok: true, meetingRequest: cancelled });
  }

  if (!isAttendee && !isAdmin) {
    return NextResponse.json({ error: "Only invited attendees can answer this request." }, { status: 403 });
  }

  if (meetingRequest.status !== "pending") {
    return NextResponse.json({ error: "Only pending requests can be answered." }, { status: 400 });
  }

  if (decision === "decline") {
    const declined = await prisma.meetingRequest.update({
      where: { id: meetingRequest.id },
      data: {
        status: "declined",
        responseNote: responseNote || null,
        respondedById: session.userId,
        respondedAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        eventId: session.eventId,
        userId: meetingRequest.requesterId,
        type: "meeting_request_declined",
        title: "Meeting request declined",
        body: `${session.name} declined: ${meetingRequest.title}`,
        deepLink: "/dashboard",
        priority: "normal",
      },
    });

    return NextResponse.json({ ok: true, meetingRequest: declined });
  }

  const startsAt = scheduledStartAt ? new Date(scheduledStartAt) : meetingRequest.proposedStartAt;
  const endsAt = new Date(startsAt.getTime() + meetingRequest.durationMin * 60_000);
  const participantIds = uniqueIds([meetingRequest.requesterId, ...attendeeIds]);

  const participants = await prisma.user.findMany({
    where: { id: { in: participantIds } },
    select: {
      id: true,
      email: true,
      name: true,
      preferredTimeZone: true,
    },
  });

  let chatRoomId = meetingRequest.chatRoomId;
  if (!chatRoomId) {
    if (meetingRequest.recipientMode === "individual" && participantIds.length === 2) {
      const otherUserId = participantIds.find((userId) => userId !== meetingRequest.requesterId);
      const directPairKey =
        otherUserId ? buildDirectPairKey(meetingRequest.requesterId, otherUserId) : null;
      const directRoom = directPairKey
        ? await prisma.chatRoom.findFirst({
            where: { eventId: session.eventId, roomType: "direct", directPairKey },
            select: { id: true },
          })
        : null;

      if (directRoom) {
        chatRoomId = directRoom.id;
      }
    }

    if (!chatRoomId) {
      const chatRoom = await prisma.chatRoom.create({
        data: {
          eventId: session.eventId,
          name:
            meetingRequest.targetLabel ||
            meetingRequest.title ||
            (meetingRequest.targetTeam?.countryName
              ? `Delegation meeting · ${meetingRequest.targetTeam.countryName}`
              : `Meeting · ${meetingRequest.requester.name}`),
          roomType:
            meetingRequest.recipientMode === "team"
              ? "team"
              : participantIds.length === 2
                ? "direct"
                : "group",
          recipientMode:
            meetingRequest.recipientMode === "individual"
              ? "direct"
              : meetingRequest.recipientMode === "team"
                ? "team"
                : "group",
          teamId: meetingRequest.targetTeamId ?? null,
          topic: `meeting:${meetingRequest.id}`,
          directPairKey:
            meetingRequest.recipientMode === "individual" && participantIds.length === 2
              ? buildDirectPairKey(participantIds[0], participantIds[1])
              : null,
          createdById: meetingRequest.requesterId,
          memberships: {
            create: participantIds.map((userId) => ({
              userId,
              role: userId === meetingRequest.requesterId ? "owner" : "member",
            })),
          },
        },
        select: { id: true },
      });
      chatRoomId = chatRoom.id;
    } else {
      await ensureRoomMemberships(prisma, chatRoomId, attendeeIds, meetingRequest.requesterId);
    }
  }

  let googleCalendarResult: { googleMeetUrl: string | null; calendarEventId: string | null } | null =
    null;

  if (meetingRequest.googleMeetRequested) {
    try {
      googleCalendarResult = await createGoogleCalendarEventForUser({
        userId: meetingRequest.requesterId,
        summary: meetingRequest.title,
        description: meetingRequest.note,
        startsAt,
        endsAt,
        timeZone: meetingRequest.organizerTimeZone || meetingRequest.requester.preferredTimeZone || "UTC",
        attendeeEmails: participants.map((participant) => participant.email),
      });
    } catch (error) {
      console.error("Google Calendar event creation failed", error);
    }
  }

  const videoRoomName = buildVideoRoomName("meeting", meetingRequest.id, meetingRequest.title);

  const meetingSession =
    meetingRequest.meetingSessionId
      ? await prisma.meetingSession.update({
          where: { id: meetingRequest.meetingSessionId },
          data: {
            title: meetingRequest.title,
            description: meetingRequest.note,
            scheduledStartAt: startsAt,
            scheduledEndAt: endsAt,
            organizerTimeZone: meetingRequest.organizerTimeZone,
            chatRoomId,
            googleMeetUrl: googleCalendarResult?.googleMeetUrl ?? undefined,
            googleCalendarEventId: googleCalendarResult?.calendarEventId ?? undefined,
          },
        })
      : await prisma.meetingSession.create({
          data: {
            eventId: session.eventId,
            organizerId: meetingRequest.requesterId,
            title: meetingRequest.title,
            description: meetingRequest.note,
            scheduledStartAt: startsAt,
            scheduledEndAt: endsAt,
            organizerTimeZone: meetingRequest.organizerTimeZone,
            chatRoomId,
            videoRoomName,
            googleMeetUrl: googleCalendarResult?.googleMeetUrl ?? null,
            googleCalendarEventId: googleCalendarResult?.calendarEventId ?? null,
            participants: {
              create: participantIds.map((userId) => ({
                userId,
                role: userId === meetingRequest.requesterId ? "host" : "attendee",
              })),
            },
          },
        });

  const accepted = await prisma.meetingRequest.update({
    where: { id: meetingRequest.id },
    data: {
      status: "accepted",
      scheduledStartAt: startsAt,
      responseNote: responseNote || null,
      chatRoomId,
      meetingSessionId: meetingSession.id,
      respondedById: session.userId,
      respondedAt: new Date(),
    },
  });

  await prisma.notification.createMany({
    data: participantIds
      .filter((userId) => userId !== session.userId)
      .map((userId) => ({
        eventId: session.eventId,
        userId,
        type: "meeting_request_accepted",
        title: "Meeting scheduled",
        body: `${meetingRequest.title} is scheduled for ${startsAt.toISOString()}`,
        deepLink: `/meetings/${meetingSession.id}`,
        priority: "high",
      })),
    skipDuplicates: true,
  });

  return NextResponse.json({
    ok: true,
    meetingRequest: accepted,
    meetingSession: {
      id: meetingSession.id,
      googleMeetUrl: meetingSession.googleMeetUrl,
      roomId: chatRoomId,
      videoRoomName: meetingSession.videoRoomName,
    },
  });
}
