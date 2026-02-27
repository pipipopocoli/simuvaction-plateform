import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contacts = await prisma.user.findMany({
    where: {
      eventId: session.eventId,
      id: { not: session.userId },
    },
    include: {
      team: {
        select: {
          id: true,
          countryName: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(
    contacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      role: contact.role,
      avatarUrl: contact.avatarUrl,
      teamId: contact.teamId,
      teamName: contact.team?.countryName ?? null,
      xUrl: contact.xUrl,
      whatsAppNumber: contact.whatsAppNumber,
    })),
  );
}
