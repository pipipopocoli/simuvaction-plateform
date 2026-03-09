import type { PrismaClient } from "@prisma/client";

export type RecipientMode = "direct" | "team" | "group";

export function uniqueIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter((value): value is string => Boolean(value))));
}

export function buildDirectPairKey(leftUserId: string, rightUserId: string) {
  return [leftUserId, rightUserId].sort().join(":");
}

export async function resolveRecipientUserIds(
  prisma: PrismaClient,
  args: {
    eventId: string;
    requesterId: string;
    targetUserId?: string | null;
    targetTeamId?: string | null;
    participantIds?: string[];
  },
) {
  const ids = uniqueIds([args.targetUserId, ...(args.participantIds ?? [])]).filter(
    (id) => id !== args.requesterId,
  );

  if (args.targetTeamId) {
    const teamMembers = await prisma.user.findMany({
      where: { eventId: args.eventId, teamId: args.targetTeamId },
      select: { id: true },
    });
    ids.push(...teamMembers.map((member) => member.id));
  }

  return uniqueIds(ids).filter((id) => id !== args.requesterId);
}

export async function ensureRoomMemberships(
  prisma: PrismaClient,
  roomId: string,
  userIds: string[],
  ownerId: string,
) {
  await prisma.chatMembership.createMany({
    data: uniqueIds([ownerId, ...userIds]).map((userId) => ({
      roomId,
      userId,
      role: userId === ownerId ? "owner" : "member",
    })),
    skipDuplicates: true,
  });
}
