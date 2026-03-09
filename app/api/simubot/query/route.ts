import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";

const querySchema = z.object({
  question: z.string().trim().min(2).max(4000),
});

function buildFallbackAnswer(question: string, context: string[]) {
  return [
    `Question: ${question}`,
    "",
    "Team memory summary:",
    ...context.slice(0, 6).map((item, index) => `${index + 1}. ${item}`),
    "",
    "No external model was configured, so this answer is based only on retrieved team context.",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = querySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [teamDocuments, teamMeetings, teamMessages] = await Promise.all([
    session.teamId
      ? prisma.teamLibraryItem.findMany({
          where: { eventId: session.eventId, teamId: session.teamId },
          orderBy: { createdAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
    prisma.meetingSession.findMany({
      where: {
        eventId: session.eventId,
        participants: { some: { userId: session.userId } },
      },
      orderBy: { scheduledStartAt: "desc" },
      take: 8,
    }),
    prisma.chatMessage.findMany({
      where: session.teamId
        ? {
            eventId: session.eventId,
            room: { teamId: session.teamId },
          }
        : {
            eventId: session.eventId,
            room: { memberships: { some: { userId: session.userId } } },
          },
      include: {
        sender: { select: { name: true } },
        room: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const context = [
    ...teamDocuments.map((item) => `Team library: ${item.title}${item.description ? ` — ${item.description}` : ""}`),
    ...teamMeetings.map((meeting) => `Meeting: ${meeting.title} at ${meeting.scheduledStartAt.toISOString()}`),
    ...teamMessages.map((message) => `Chat ${message.room.name}: ${message.sender.name} said "${message.body.slice(0, 160)}"`),
  ];

  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.SIMUBOT_MODEL ?? "gpt-4.1-mini";

  if (!apiKey) {
    return NextResponse.json({
      answer: buildFallbackAnswer(parsed.data.question, context),
      sources: context.slice(0, 12),
      mode: "retrieval-only",
    });
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are SimuBot for SimuVaction. Answer only from the provided team memory. If the answer is not in memory, say so plainly. Never reveal data outside the user's team context.",
          },
          {
            role: "user",
            content: `Question: ${parsed.data.question}\n\nTeam memory:\n${context.join("\n")}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const completion = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };

    return NextResponse.json({
      answer:
        completion.choices?.[0]?.message?.content?.trim() ||
        buildFallbackAnswer(parsed.data.question, context),
      sources: context.slice(0, 12),
      mode: "llm",
    });
  } catch (error) {
    console.error("SimuBot query failed", error);
    return NextResponse.json({
      answer: buildFallbackAnswer(parsed.data.question, context),
      sources: context.slice(0, 12),
      mode: "retrieval-fallback",
    });
  }
}
