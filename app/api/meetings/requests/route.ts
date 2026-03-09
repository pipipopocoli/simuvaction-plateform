import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import { resolveWorkspacePath } from "@/lib/authz";
import { resolveRecipientUserIds, uniqueIds } from "@/lib/communications";
import { resolveUserTimeZone } from "@/lib/user-timezone";

const createMeetingRequestSchema = z.object({
  recipientMode: z.enum(["individual", "team", "group"]).optional(),
  targetUserId: z.string().min(1).optional(),
  targetTeamId: z.string().min(1).optional(),
  attendeeIds: z.array(z.string().min(1)).default([]),
  title: z.string().trim().min(2).max(120),
  note: z.string().trim().max(1000).optional(),
  proposedStartAt: z.string().datetime(),
  durationMin: z.number().int().min(10).max(240).default(30),
  organizerTimeZone: z.string().trim().min(2).max(80).optional(),
  googleMeetRequested: z.boolean().optional(),
});

async function serializeRequests(
  requests: Array<{
    id: string;
    recipientMode: string;
    attendeeUserIds: string[];
    organizerTimeZone: string | null;
    title: string;
    note: string | null;
    status: string;
    proposedStartAt: Date;
    scheduledStartAt: Date | null;
    createdAt: Date;
    targetLabel: string | null;
    requester: { id: string; name: string; role: string; avatarUrl: string | null; preferredTimeZone?: string | null; team?: { countryCode: string } | null };
    targetUser: { id: string; name: string; role: string; avatarUrl: string | null; preferredTimeZone?: string | null; team?: { countryCode: string } | null } | null;
    requesterTeam: { id: string; countryName: string; countryCode?: string } | null;
    targetTeam: { id: string; countryName: string; countryCode?: string } | null;
    chatRoom: { id: string; name: string } | null;
    meetingSession: { id: string; status: string; googleMeetUrl: string | null } | null;
  }>,
) {
  const attendeeIds = uniqueIds(requests.flatMap((request) => request.attendeeUserIds));
  const attendees =
    attendeeIds.length === 0
      ? []
      : await prisma.user.findMany({
          where: { id: { in: attendeeIds } },
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true,
            preferredTimeZone: true,
            team: { select: { countryCode: true, countryName: true } },
          },
        });

  const attendeeMap = new Map(
    attendees.map((user) => [
      user.id,
      {
        id: user.id,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        teamName: user.team?.countryName ?? null,
        preferredTimeZone: resolveUserTimeZone(user.preferredTimeZone, user.team?.countryCode),
      },
    ]),
  );

  return requests.map((request) => ({
    ...request,
    proposedStartAt: request.proposedStartAt.toISOString(),
    scheduledStartAt: request.scheduledStartAt?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
    organizerTimeZone:
      request.organizerTimeZone ??
      resolveUserTimeZone(request.requester.preferredTimeZone, request.requester.team?.countryCode),
    requester: {
      id: request.requester.id,
      name: request.requester.name,
      role: request.requester.role,
      avatarUrl: request.requester.avatarUrl,
    },
    targetUser: request.targetUser
      ? {
          id: request.targetUser.id,
          name: request.targetUser.name,
          role: request.targetUser.role,
          avatarUrl: request.targetUser.avatarUrl,
        }
      : null,
    attendees: request.attendeeUserIds.map((userId) => attendeeMap.get(userId)).filter(Boolean),
  }));
}

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [incomingRaw, outgoingRaw] = await Promise.all([
    prisma.meetingRequest.findMany({
      where: {
        eventId: session.eventId,
        OR: [{ targetUserId: session.userId }, { attendeeUserIds: { has: session.userId } }],
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true,
            preferredTimeZone: true,
            team: { select: { countryCode: true } },
          },
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true,
            preferredTimeZone: true,
            team: { select: { countryCode: true } },
          },
        },
        requesterTeam: { select: { id: true, countryName: true, countryCode: true } },
        targetTeam: { select: { id: true, countryName: true, countryCode: true } },
        chatRoom: { select: { id: true, name: true } },
        meetingSession: { select: { id: true, status: true, googleMeetUrl: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.meetingRequest.findMany({
      where: { eventId: session.eventId, requesterId: session.userId },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true,
            preferredTimeZone: true,
            team: { select: { countryCode: true } },
          },
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true,
            preferredTimeZone: true,
            team: { select: { countryCode: true } },
          },
        },
        requesterTeam: { select: { id: true, countryName: true, countryCode: true } },
        targetTeam: { select: { id: true, countryName: true, countryCode: true } },
        chatRoom: { select: { id: true, name: true } },
        meetingSession: { select: { id: true, status: true, googleMeetUrl: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const [incoming, outgoing] = await Promise.all([
    serializeRequests(incomingRaw),
    serializeRequests(outgoingRaw),
  ]);

  return NextResponse.json({ incoming, outgoing });
}

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = createMeetingRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const recipientMode =
    input.recipientMode ??
    (input.targetTeamId ? "team" : input.attendeeIds.length > 1 ? "group" : "individual");

  const attendeeUserIds = await resolveRecipientUserIds(prisma, {
    eventId: session.eventId,
    requesterId: session.userId,
    targetUserId: input.targetUserId,
    targetTeamId: input.targetTeamId,
    participantIds: input.attendeeIds,
  });

  if (attendeeUserIds.length === 0) {
    return NextResponse.json({ error: "At least one attendee is required." }, { status: 400 });
  }

  const [targetUser, targetTeam] = await Promise.all([
    input.targetUserId
      ? prisma.user.findFirst({
          where: { id: input.targetUserId, eventId: session.eventId },
          select: { id: true, name: true, teamId: true },
        })
      : Promise.resolve(null),
    input.targetTeamId
      ? prisma.team.findFirst({
          where: { id: input.targetTeamId, eventId: session.eventId },
          select: { id: true, countryName: true },
        })
      : Promise.resolve(null),
  ]);

  if (input.targetUserId && !targetUser) {
    return NextResponse.json({ error: "Target user was not found in this event." }, { status: 404 });
  }

  if (input.targetTeamId && !targetTeam) {
    return NextResponse.json({ error: "Target delegation was not found in this event." }, { status: 404 });
  }

  if (input.organizerTimeZone) {
    await prisma.user.update({
      where: { id: session.userId },
      data: { preferredTimeZone: input.organizerTimeZone },
    });
  }

  const meetingRequest = await prisma.meetingRequest.create({
    data: {
      eventId: session.eventId,
      requesterId: session.userId,
      targetUserId: targetUser?.id ?? null,
      requesterTeamId: session.teamId ?? null,
      targetTeamId: targetTeam?.id ?? targetUser?.teamId ?? null,
      attendeeUserIds,
      recipientMode,
      title: input.title,
      targetLabel:
        targetTeam?.countryName ??
        (recipientMode === "group" ? "Private group" : targetUser?.name ?? null),
      note: input.note?.trim() || null,
      proposedStartAt: new Date(input.proposedStartAt),
      durationMin: input.durationMin,
      organizerTimeZone: input.organizerTimeZone ?? null,
      googleMeetRequested: input.googleMeetRequested ?? false,
      status: "pending",
    },
    include: {
      requester: { select: { id: true, name: true, role: true, avatarUrl: true, preferredTimeZone: true, team: { select: { countryCode: true } } } },
      targetUser: { select: { id: true, name: true, role: true, avatarUrl: true, preferredTimeZone: true, team: { select: { countryCode: true } } } },
      requesterTeam: { select: { id: true, countryName: true, countryCode: true } },
      targetTeam: { select: { id: true, countryName: true, countryCode: true } },
      chatRoom: { select: { id: true, name: true } },
      meetingSession: { select: { id: true, status: true, googleMeetUrl: true } },
    },
  });

  if (attendeeUserIds.length > 0) {
    await prisma.notification.createMany({
      data: attendeeUserIds.map((attendeeUserId) => ({
        eventId: session.eventId,
        userId: attendeeUserId,
        type: "meeting_request",
        title: "New meeting request",
        body: `${meetingRequest.requester.name} requested: ${meetingRequest.title}`,
        deepLink: resolveWorkspacePath(session.role),
        priority: "high",
      })),
      skipDuplicates: true,
    });
  }

  const [serialized] = await serializeRequests([meetingRequest]);
  return NextResponse.json({ ok: true, meetingRequest: serialized }, { status: 201 });
}
