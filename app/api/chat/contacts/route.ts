import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import { resolveUserTimeZone } from "@/lib/user-timezone";

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [currentUser, contacts, teams] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        preferredTimeZone: true,
        team: { select: { countryCode: true } },
      },
    }),
    prisma.user.findMany({
      where: {
        eventId: session.eventId,
        id: { not: session.userId },
      },
      select: {
        id: true,
        name: true,
        role: true,
        displayRole: true,
        mediaOutlet: true,
        avatarUrl: true,
        teamId: true,
        preferredTimeZone: true,
        team: {
          select: {
            id: true,
            countryCode: true,
            countryName: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
    prisma.team.findMany({
      where: { eventId: session.eventId },
      select: {
        id: true,
        countryCode: true,
        countryName: true,
        _count: { select: { users: true } },
      },
      orderBy: [{ countryName: "asc" }],
    }),
  ]);

  return NextResponse.json({
    currentUserTimeZone: resolveUserTimeZone(
      currentUser?.preferredTimeZone,
      currentUser?.team?.countryCode,
    ),
    members: contacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      role: contact.role,
      displayRole: contact.displayRole,
      mediaOutlet: contact.mediaOutlet,
      avatarUrl: contact.avatarUrl,
      teamId: contact.teamId,
      teamName: contact.team?.countryName ?? null,
      preferredTimeZone: resolveUserTimeZone(
        contact.preferredTimeZone,
        contact.team?.countryCode,
      ),
    })),
    teams: teams.map((team) => ({
      id: team.id,
      countryCode: team.countryCode,
      name: team.countryName,
      memberCount: team._count.users,
      preferredTimeZone: resolveUserTimeZone(null, team.countryCode),
    })),
  });
}
