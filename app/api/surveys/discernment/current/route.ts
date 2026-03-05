import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  let wave = await prisma.discernmentWave.findFirst({
    where: {
      eventId: session.eventId,
      opensAt: { lte: now },
      OR: [{ closesAt: null }, { closesAt: { gte: now } }],
    },
    include: {
      template: true,
      responses: {
        where: { userId: session.userId },
        take: 1,
      },
    },
    orderBy: [{ opensAt: "desc" }],
  });

  if (!wave) {
    wave = await prisma.discernmentWave.findFirst({
      where: { eventId: session.eventId },
      include: {
        template: true,
        responses: {
          where: { userId: session.userId },
          take: 1,
        },
      },
      orderBy: [{ orderIndex: "asc" }],
    });
  }

  if (!wave) {
    return NextResponse.json({ wave: null });
  }

  return NextResponse.json({
    wave: {
      id: wave.id,
      label: wave.label,
      orderIndex: wave.orderIndex,
      opensAt: wave.opensAt,
      closesAt: wave.closesAt,
      template: {
        id: wave.template.id,
        title: wave.template.title,
        description: wave.template.description,
        questions: wave.template.questionsJson,
      },
      response: wave.responses[0] ?? null,
    },
  });
}
