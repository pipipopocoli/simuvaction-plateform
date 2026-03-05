import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";

const discernmentResponseSchema = z.object({
  waveId: z.string().min(1),
  answers: z.array(z.number().min(1).max(5)).min(1),
  notes: z.string().max(3000).optional(),
});

function computeScore(answers: number[]): number {
  if (answers.length === 0) return 0;
  const sum = answers.reduce((acc, value) => acc + value, 0);
  return Number((sum / answers.length).toFixed(2));
}

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = discernmentResponseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const wave = await prisma.discernmentWave.findFirst({
    where: {
      id: parsed.data.waveId,
      eventId: session.eventId,
    },
    include: { template: true },
  });

  if (!wave) {
    return NextResponse.json({ error: "Wave not found." }, { status: 404 });
  }

  const questionCount = Array.isArray(wave.template.questionsJson)
    ? wave.template.questionsJson.length
    : 0;

  if (questionCount > 0 && parsed.data.answers.length !== questionCount) {
    return NextResponse.json(
      { error: `Expected ${questionCount} answers.` },
      { status: 400 },
    );
  }

  const score = computeScore(parsed.data.answers);

  const response = await prisma.discernmentResponse.upsert({
    where: {
      waveId_userId: {
        waveId: parsed.data.waveId,
        userId: session.userId,
      },
    },
    update: {
      answersJson: {
        answers: parsed.data.answers,
        notes: parsed.data.notes ?? null,
      },
      score,
    },
    create: {
      eventId: session.eventId,
      waveId: parsed.data.waveId,
      userId: session.userId,
      answersJson: {
        answers: parsed.data.answers,
        notes: parsed.data.notes ?? null,
      },
      score,
    },
  });

  return NextResponse.json({
    ok: true,
    responseId: response.id,
    score,
  });
}
