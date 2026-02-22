import { TaskStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createTaskSchema = z.object({
  pillarId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  deadline: z.string().datetime(),
  priority: z.number().int().min(1).max(3),
  urgent: z.boolean().optional().default(false),
  tagIds: z.array(z.string()).optional().default([]),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existingCount = await prisma.taskCard.count({
    where: {
      pillarId: parsed.data.pillarId,
      status: TaskStatus.NEW,
    },
  });

  const task = await prisma.taskCard.create({
    data: {
      pillarId: parsed.data.pillarId,
      title: parsed.data.title,
      description: parsed.data.description,
      deadline: new Date(parsed.data.deadline),
      priority: parsed.data.priority,
      urgent: parsed.data.urgent,
      status: TaskStatus.NEW,
      orderIndex: existingCount,
      ...(parsed.data.tagIds.length > 0
        ? {
            tags: {
              create: parsed.data.tagIds.map((tagId) => ({ tagId })),
            },
          }
        : {}),
    },
    include: {
      tags: { include: { tag: true } },
      checklistSections: { include: { items: true } },
      attachments: true,
    },
  });

  return NextResponse.json({ task });
}
