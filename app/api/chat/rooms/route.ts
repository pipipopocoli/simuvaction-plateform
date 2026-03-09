import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import {
  buildDirectPairKey,
  ensureRoomMemberships,
  resolveRecipientUserIds,
  uniqueIds,
} from "@/lib/communications";

const createRoomSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  roomType: z.enum(["direct", "team", "group", "global"]).default("group"),
  recipientMode: z.enum(["direct", "team", "group"]).optional(),
  teamId: z.string().min(1).optional(),
  targetTeamId: z.string().min(1).optional(),
  targetUserId: z.string().min(1).optional(),
  participantIds: z.array(z.string().min(1)).default([]),
  topic: z.string().trim().max(160).optional(),
});

async function ensureGlobalRoom(eventId: string, userId: string) {
  const existing = await prisma.chatRoom.findFirst({
    where: { eventId, roomType: "global" },
    select: { id: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.chatRoom.create({
    data: {
      eventId,
      name: "Global Assembly",
      roomType: "global",
      recipientMode: "group",
      createdById: userId,
      memberships: {
        create: [{ userId, role: "owner" }],
      },
    },
    select: { id: true },
  });
}

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId, userId } = session;

  try {
    await ensureGlobalRoom(eventId, userId);

    const rooms = await prisma.chatRoom.findMany({
      where: {
        eventId,
        OR: [{ roomType: "global" }, { memberships: { some: { userId } } }],
      },
      include: {
        _count: { select: { messages: true, memberships: true } },
      },
      orderBy: [{ roomType: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(
      rooms.map((room) => ({
        id: room.id,
        name: room.name,
        roomType: room.roomType,
        recipientMode: room.recipientMode,
        topic: room.topic,
        teamId: room.teamId,
        _count: room._count,
      })),
    );
  } catch (error) {
    console.error("GET ChatRooms error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId, userId } = session;
  const payload = await request.json().catch(() => null);
  const parsed = createRoomSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;

  try {
    if (input.roomType === "global") {
      if (session.role !== "admin" && session.role !== "game_master") {
        return NextResponse.json({ error: "Only admins can create a global room." }, { status: 403 });
      }
      const globalRoom = await ensureGlobalRoom(eventId, userId);
      return NextResponse.json(globalRoom);
    }

    if (input.roomType === "direct") {
      if (!input.targetUserId) {
        return NextResponse.json({ error: "targetUserId is required." }, { status: 400 });
      }

      if (input.targetUserId === userId) {
        return NextResponse.json({ error: "Cannot create a direct room with yourself." }, { status: 400 });
      }

      const targetUser = await prisma.user.findFirst({
        where: { id: input.targetUserId, eventId },
        select: { id: true, name: true },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "Target user not found in this event." }, { status: 404 });
      }

      const directPairKey = buildDirectPairKey(userId, targetUser.id);
      const existingDirectRoom = await prisma.chatRoom.findFirst({
        where: { eventId, roomType: "direct", directPairKey },
        include: { _count: { select: { messages: true, memberships: true } } },
      });

      if (existingDirectRoom) {
        await ensureRoomMemberships(prisma, existingDirectRoom.id, [targetUser.id], userId);
        return NextResponse.json(existingDirectRoom);
      }

      const directRoom = await prisma.chatRoom.create({
        data: {
          eventId,
          name: input.name?.trim() || `Direct: ${targetUser.name}`,
          roomType: "direct",
          recipientMode: "direct",
          directPairKey,
          createdById: userId,
          topic: input.topic?.trim() || null,
          memberships: {
            create: [
              { userId, role: "owner" },
              { userId: targetUser.id, role: "member" },
            ],
          },
        },
        include: { _count: { select: { messages: true, memberships: true } } },
      });

      return NextResponse.json(directRoom);
    }

    if (input.roomType === "team") {
      if (!input.targetTeamId) {
        return NextResponse.json({ error: "targetTeamId is required." }, { status: 400 });
      }

      const targetTeam = await prisma.team.findFirst({
        where: { id: input.targetTeamId, eventId },
        select: { id: true, countryName: true },
      });

      if (!targetTeam) {
        return NextResponse.json({ error: "Target delegation not found in this event." }, { status: 404 });
      }

      const topic = input.topic?.trim() || `team:${targetTeam.id}`;
      const existingTeamRoom = await prisma.chatRoom.findFirst({
        where: {
          eventId,
          roomType: "team",
          teamId: targetTeam.id,
          topic,
          memberships: { some: { userId } },
        },
        include: { _count: { select: { messages: true, memberships: true } } },
      });

      const memberIds = await resolveRecipientUserIds(prisma, {
        eventId,
        requesterId: userId,
        targetTeamId: targetTeam.id,
        participantIds: input.participantIds,
      });

      if (existingTeamRoom) {
        await ensureRoomMemberships(prisma, existingTeamRoom.id, memberIds, userId);
        return NextResponse.json(existingTeamRoom);
      }

      const teamRoom = await prisma.chatRoom.create({
        data: {
          eventId,
          name: input.name?.trim() || `Delegation channel · ${targetTeam.countryName}`,
          roomType: "team",
          recipientMode: "team",
          teamId: targetTeam.id,
          topic,
          createdById: userId,
          memberships: {
            create: uniqueIds([userId, ...memberIds]).map((memberId) => ({
              userId: memberId,
              role: memberId === userId ? "owner" : "member",
            })),
          },
        },
        include: { _count: { select: { messages: true, memberships: true } } },
      });

      return NextResponse.json(teamRoom);
    }

    const participantIds = await resolveRecipientUserIds(prisma, {
      eventId,
      requesterId: userId,
      participantIds: input.participantIds,
      targetUserId: input.targetUserId,
      targetTeamId: input.targetTeamId,
    });

    if (participantIds.length === 0) {
      return NextResponse.json({ error: "At least one participant is required." }, { status: 400 });
    }

    const room = await prisma.chatRoom.create({
      data: {
        eventId,
        name: input.name?.trim() || "Private group",
        roomType: "group",
        recipientMode: input.recipientMode ?? "group",
        teamId: input.teamId ?? null,
        topic: input.topic?.trim() || null,
        createdById: userId,
        memberships: {
          create: uniqueIds([userId, ...participantIds]).map((memberId) => ({
            userId: memberId,
            role: memberId === userId ? "owner" : "member",
          })),
        },
      },
      include: { _count: { select: { messages: true, memberships: true } } },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error("POST ChatRoom error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
