import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";

const responseSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        rating: z.number().int().min(1).max(5).optional(),
        textValue: z.string().max(3000).optional(),
      }),
    )
    .min(1),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: Params) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = responseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const survey = await prisma.conferenceSurvey.findFirst({
    where: {
      id,
      eventId: session.eventId,
      isPublished: true,
    },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!survey) {
    return NextResponse.json({ error: "Survey not found." }, { status: 404 });
  }

  const answersByQuestionId = new Map(
    parsed.data.answers.map((answer) => [answer.questionId, answer]),
  );

  for (const question of survey.questions) {
    const answer = answersByQuestionId.get(question.id);
    if (question.required && !answer) {
      return NextResponse.json(
        { error: `Missing required answer for question ${question.id}.` },
        { status: 400 },
      );
    }

    if (!answer) {
      continue;
    }

    if (question.questionType === "rating" && typeof answer.rating !== "number") {
      return NextResponse.json(
        { error: `Question ${question.id} expects a rating.` },
        { status: 400 },
      );
    }

    if (question.questionType === "text" && typeof answer.textValue !== "string") {
      return NextResponse.json(
        { error: `Question ${question.id} expects a text answer.` },
        { status: 400 },
      );
    }
  }

  const response = await prisma.conferenceSurveyResponse.upsert({
    where: {
      surveyId_userId: {
        surveyId: survey.id,
        userId: session.userId,
      },
    },
    update: {
      answersJson: parsed.data.answers,
    },
    create: {
      eventId: session.eventId,
      surveyId: survey.id,
      userId: session.userId,
      answersJson: parsed.data.answers,
    },
  });

  return NextResponse.json({
    ok: true,
    responseId: response.id,
  });
}
