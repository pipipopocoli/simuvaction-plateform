import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import { isAdminLike } from "@/lib/authz";

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
      createdById: userId,
      memberships: {
        create: [{ userId, role: "owner" }],
      },
    },
    select: { id: true },
  });
}

function buildDirectPairKey(leftUserId: string, rightUserId: string) {
  return [leftUserId, rightUserId].sort().join(":");
}

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId, userId, role } = session;

  try {
    await ensureGlobalRoom(eventId, userId);

    const rooms =
      isAdminLike(role)
        ? await prisma.chatRoom.findMany({
            where: { eventId },
            include: { _count: { select: { messages: true } } },
            orderBy: { createdAt: "asc" },
          })
        : await prisma.chatRoom.findMany({
            where: {
              eventId,
              OR: [{ roomType: "global" }, { memberships: { some: { userId } } }],
            },
            include: { _count: { select: { messages: true } } },
            orderBy: { createdAt: "asc" },
          });

    return NextResponse.json(rooms);
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

  const { eventId, userId, teamId: requesterTeamId } = session;

  try {
    const {
      name,
      roomType,
      teamId,
      participantIds = [],
      targetTeamId,
      targetUserId,
    } = await request.json();

    if (!roomType) {
      return NextResponse.json({ error: "Missing required field: roomType." }, { status: 400 });
    }

    if (roomType === "direct") {
      if (!targetUserId || typeof targetUserId !== "string") {
        return NextResponse.json({ error: "targetUserId is required for direct rooms." }, { status: 400 });
      }

      if (targetUserId === userId) {
        return NextResponse.json({ error: "Cannot create a direct room with yourself." }, { status: 400 });
      }

      const targetUser = await prisma.user.findFirst({
        where: { id: targetUserId, eventId },
        select: { id: true, name: true },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "Target user not found in this event." }, { status: 404 });
      }

      const directPairKey = buildDirectPairKey(userId, targetUserId);
      const existingDirectRoom = await prisma.chatRoom.findFirst({
        where: { eventId, roomType: "direct", directPairKey },
        include: { _count: { select: { messages: true } } },
      });

      if (existingDirectRoom) {
        await prisma.chatMembership.createMany({
          data: [
            { roomId: existingDirectRoom.id, userId, role: "member" },
            { roomId: existingDirectRoom.id, userId: targetUserId, role: "member" },
          ],
          skipDuplicates: true,
        });
        return NextResponse.json(existingDirectRoom);
      }

      const directRoom = await prisma.chatRoom.create({
        data: {
          eventId,
          name: `Direct: ${targetUser.name}`,
          roomType: "direct",
          directPairKey,
          createdById: userId,
          memberships: {
            create: [
              { userId, role: "owner" },
              { userId: targetUserId, role: "member" },
            ],
          },
        },
        include: { _count: { select: { messages: true } } },
      });

      return NextResponse.json(directRoom);
    }

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing required field: name." }, { status: 400 });
    }

    const membersToAdd: { userId: string; role: string }[] = [{ userId, role: "owner" }];
    let customEnrollmentUserIds: string[] = Array.isArray(participantIds) ? [...participantIds] : [];

    if (targetTeamId && typeof targetTeamId === "string") {
      const usersToEnroll = await prisma.user.findMany({
        where: {
          eventId,
          OR: [{ teamId: targetTeamId }, { teamId: requesterTeamId ?? undefined }],
        },
        select: { id: true },
      });
      usersToEnroll.forEach((member) => customEnrollmentUserIds.push(member.id));
    }

    customEnrollmentUserIds = Array.from(new Set(customEnrollmentUserIds));

    customEnrollmentUserIds.forEach((id) => {
      if (id !== userId) {
        membersToAdd.push({ userId: id, role: "member" });
      }
    });

    const room = await prisma.chatRoom.create({
      data: {
        eventId,
        name,
        roomType,
        teamId: typeof teamId === "string" ? teamId : null,
        createdById: userId,
        memberships: {
          create: membersToAdd,
        },
      },
      include: { _count: { select: { messages: true } } },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error("POST ChatRoom error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
