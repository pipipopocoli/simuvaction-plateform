import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const surveys = await prisma.conferenceSurvey.findMany({
    where: {
      eventId: session.eventId,
      isPublished: true,
    },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
      },
      responses: {
        where: { userId: session.userId },
        select: {
          id: true,
          answersJson: true,
          updatedAt: true,
        },
        take: 1,
      },
    },
    orderBy: { conferenceNumber: "asc" },
  });

  return NextResponse.json({
    surveys: surveys.map((survey) => ({
      id: survey.id,
      conferenceNumber: survey.conferenceNumber,
      title: survey.title,
      description: survey.description,
      questions: survey.questions,
      response: survey.responses[0] ?? null,
      hasResponded: survey.responses.length > 0,
    })),
  });
}
