import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";

const decisionSchema = z.object({
  decision: z.enum(["accept", "decline", "cancel"]),
  scheduledStartAt: z.string().datetime().optional(),
  responseNote: z.string().trim().max(1000).optional(),
});

function buildDirectPairKey(leftUserId: string, rightUserId: string) {
  return [leftUserId, rightUserId].sort().join(":");
}

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

  const meetingRequest = await prisma.meetingRequest.findFirst({
    where: { id, eventId: session.eventId },
    include: {
      requester: { select: { id: true, name: true, role: true } },
      targetUser: { select: { id: true, name: true, role: true } },
      chatRoom: { select: { id: true } },
    },
  });

  if (!meetingRequest) {
    return NextResponse.json({ error: "Meeting request not found." }, { status: 404 });
  }

  const isAdmin = session.role === "admin";
  const isRequester = meetingRequest.requesterId === session.userId;
  const isTarget = meetingRequest.targetUserId === session.userId;

  const { decision, scheduledStartAt, responseNote } = parsed.data;

  if (decision === "cancel") {
    if (!isRequester && !isAdmin) {
      return NextResponse.json({ error: "Only the requester can cancel this request." }, { status: 403 });
    }

    if (meetingRequest.status === "cancelled") {
      return NextResponse.json({ ok: true, meetingRequest });
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

    await prisma.notification.create({
      data: {
        eventId: session.eventId,
        userId: meetingRequest.targetUserId,
        type: "meeting_request_cancelled",
        title: "Meeting request cancelled",
        body: `${meetingRequest.requester.name} cancelled: ${meetingRequest.title}`,
        deepLink: `/workspace/${meetingRequest.targetUser.role}`,
        priority: "normal",
      },
    });

    return NextResponse.json({ ok: true, meetingRequest: cancelled });
  }

  if (!isTarget && !isAdmin) {
    return NextResponse.json({ error: "Only the target user can answer this request." }, { status: 403 });
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
        body: `${meetingRequest.targetUser.name} declined: ${meetingRequest.title}`,
        deepLink: `/workspace/${meetingRequest.requester.role}`,
        priority: "normal",
      },
    });

    return NextResponse.json({ ok: true, meetingRequest: declined });
  }

  const directPairKey = buildDirectPairKey(meetingRequest.requesterId, meetingRequest.targetUserId);

  let directRoom = await prisma.chatRoom.findFirst({
    where: {
      eventId: session.eventId,
      roomType: "direct",
      directPairKey,
    },
    select: { id: true },
  });

  if (!directRoom) {
    directRoom = await prisma.chatRoom.create({
      data: {
        eventId: session.eventId,
        name: `Direct: ${meetingRequest.requester.name} x ${meetingRequest.targetUser.name}`,
        roomType: "direct",
        directPairKey,
        createdById: session.userId,
        memberships: {
          create: [
            { userId: meetingRequest.requesterId, role: "member" },
            { userId: meetingRequest.targetUserId, role: "member" },
          ],
        },
      },
      select: { id: true },
    });
  } else {
    await prisma.chatMembership.createMany({
      data: [
        { roomId: directRoom.id, userId: meetingRequest.requesterId, role: "member" },
        { roomId: directRoom.id, userId: meetingRequest.targetUserId, role: "member" },
      ],
      skipDuplicates: true,
    });
  }

  const accepted = await prisma.meetingRequest.update({
    where: { id: meetingRequest.id },
    data: {
      status: "accepted",
      scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt) : meetingRequest.proposedStartAt,
      responseNote: responseNote || null,
      chatRoomId: directRoom.id,
      respondedById: session.userId,
      respondedAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      eventId: session.eventId,
      userId: meetingRequest.requesterId,
      type: "meeting_request_accepted",
      title: "Meeting request accepted",
      body: `${meetingRequest.targetUser.name} accepted: ${meetingRequest.title}`,
      deepLink: `/chat/${directRoom.id}`,
      priority: "high",
    },
  });

  return NextResponse.json({ ok: true, meetingRequest: accepted, roomId: directRoom.id });
}
