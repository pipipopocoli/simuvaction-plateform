import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import { isAdminLike } from "@/lib/authz";

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function GET() {
  const session = await getUserSession();
  if (!session || (session.role !== "leader" && !isAdminLike(session.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [surveys, discernmentWaves] = await Promise.all([
    prisma.conferenceSurvey.findMany({
      where: { eventId: session.eventId },
      include: {
        responses: {
          select: {
            answersJson: true,
          },
        },
      },
      orderBy: { conferenceNumber: "asc" },
    }),
    prisma.discernmentWave.findMany({
      where: { eventId: session.eventId },
      include: {
        responses: {
          select: {
            score: true,
          },
        },
      },
      orderBy: { orderIndex: "asc" },
    }),
  ]);

  const conferenceInsights = surveys.map((survey) => {
    let ratingsTotal = 0;
    let ratingsCount = 0;

    for (const response of survey.responses) {
      if (!Array.isArray(response.answersJson)) {
        continue;
      }

      for (const answer of response.answersJson) {
        if (typeof answer !== "object" || answer === null) {
          continue;
        }

        const rating = toNumber((answer as Record<string, unknown>).rating);
        if (rating !== null) {
          ratingsTotal += rating;
          ratingsCount += 1;
        }
      }
    }

    return {
      surveyId: survey.id,
      conferenceNumber: survey.conferenceNumber,
      title: survey.title,
      responseCount: survey.responses.length,
      averageRating:
        ratingsCount > 0
          ? Number((ratingsTotal / ratingsCount).toFixed(2))
          : null,
    };
  });

  const discernmentInsights = discernmentWaves.map((wave) => {
    const scoredResponses = wave.responses
      .map((response) => response.score)
      .filter((score): score is number => typeof score === "number");
    const averageScore =
      scoredResponses.length > 0
        ? Number(
            (
              scoredResponses.reduce((acc, score) => acc + score, 0) /
              scoredResponses.length
            ).toFixed(2),
          )
        : null;

    return {
      waveId: wave.id,
      label: wave.label,
      orderIndex: wave.orderIndex,
      responseCount: wave.responses.length,
      averageScore,
    };
  });

  return NextResponse.json({
    conferenceInsights,
    discernmentInsights,
  });
}
