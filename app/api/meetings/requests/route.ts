import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import { resolveWorkspacePath } from "@/lib/authz";

const createMeetingRequestSchema = z.object({
  targetUserId: z.string().min(1),
  targetTeamId: z.string().min(1).optional(),
  title: z.string().trim().min(2).max(120),
  note: z.string().trim().max(1000).optional(),
  proposedStartAt: z.string().datetime(),
  durationMin: z.number().int().min(10).max(240).default(30),
});

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [incoming, outgoing] = await Promise.all([
    prisma.meetingRequest.findMany({
      where: { eventId: session.eventId, targetUserId: session.userId },
      include: {
        requester: { select: { id: true, name: true, role: true, avatarUrl: true } },
        targetUser: { select: { id: true, name: true, role: true, avatarUrl: true } },
        requesterTeam: { select: { id: true, countryName: true } },
        targetTeam: { select: { id: true, countryName: true } },
        chatRoom: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.meetingRequest.findMany({
      where: { eventId: session.eventId, requesterId: session.userId },
      include: {
        requester: { select: { id: true, name: true, role: true, avatarUrl: true } },
        targetUser: { select: { id: true, name: true, role: true, avatarUrl: true } },
        requesterTeam: { select: { id: true, countryName: true } },
        targetTeam: { select: { id: true, countryName: true } },
        chatRoom: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
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

  if (input.targetUserId === session.userId) {
    return NextResponse.json({ error: "You cannot request a meeting with yourself." }, { status: 400 });
  }

  const [targetUser, targetTeam] = await Promise.all([
    prisma.user.findFirst({
      where: { id: input.targetUserId, eventId: session.eventId },
      select: { id: true, name: true, teamId: true },
    }),
    input.targetTeamId
      ? prisma.team.findFirst({
          where: { id: input.targetTeamId, eventId: session.eventId },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  if (!targetUser) {
    return NextResponse.json({ error: "Target user was not found in this event." }, { status: 404 });
  }

  if (input.targetTeamId && !targetTeam) {
    return NextResponse.json({ error: "Target delegation was not found in this event." }, { status: 404 });
  }

  const meetingRequest = await prisma.meetingRequest.create({
    data: {
      eventId: session.eventId,
      requesterId: session.userId,
      targetUserId: input.targetUserId,
      requesterTeamId: session.teamId ?? null,
      targetTeamId: input.targetTeamId ?? targetUser.teamId ?? null,
      title: input.title,
      note: input.note?.trim() || null,
      proposedStartAt: new Date(input.proposedStartAt),
      durationMin: input.durationMin,
      status: "pending",
    },
    include: {
      requester: { select: { id: true, name: true, role: true, avatarUrl: true } },
      targetUser: { select: { id: true, name: true, role: true, avatarUrl: true } },
      requesterTeam: { select: { id: true, countryName: true } },
      targetTeam: { select: { id: true, countryName: true } },
    },
  });

  await prisma.notification.create({
    data: {
      eventId: session.eventId,
      userId: input.targetUserId,
      type: "meeting_request",
      title: "New meeting request",
      body: `${meetingRequest.requester.name} requested: ${meetingRequest.title}`,
      deepLink: resolveWorkspacePath(meetingRequest.targetUser.role),
      priority: "high",
    },
  });

  return NextResponse.json({ ok: true, meetingRequest }, { status: 201 });
}
