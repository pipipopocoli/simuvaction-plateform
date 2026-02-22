import { TaskStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  deadline: z.string().datetime().optional(),
  priority: z.number().int().min(1).max(3).optional(),
  urgent: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const updateData: {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    deadline?: Date;
    priority?: number;
    urgent?: boolean;
  } = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.deadline !== undefined) updateData.deadline = new Date(data.deadline);
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.urgent !== undefined) updateData.urgent = data.urgent;

  await prisma.taskCard.update({
    where: { id },
    data: updateData,
  });

  if (data.tagIds !== undefined) {
    const operations = [prisma.taskTag.deleteMany({ where: { taskId: id } })];

    if (data.tagIds.length > 0) {
      operations.push(
        prisma.taskTag.createMany({
          data: data.tagIds.map((tagId) => ({ taskId: id, tagId })),
        }),
      );
    }

    await prisma.$transaction(operations);
  }

  const task = await prisma.taskCard.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      checklistSections: {
        orderBy: { orderIndex: "asc" },
        include: {
          items: { orderBy: { orderIndex: "asc" } },
        },
      },
      attachments: true,
    },
  });

  return NextResponse.json({ task });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existingTask = await prisma.taskCard.findUnique({
      where: { id },
      select: {
        id: true,
        pillarId: true,
        status: true,
        orderIndex: true,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.taskCard.delete({
        where: { id: existingTask.id },
      }),
      prisma.taskCard.updateMany({
        where: {
          pillarId: existingTask.pillarId,
          status: existingTask.status,
          orderIndex: { gt: existingTask.orderIndex },
        },
        data: {
          orderIndex: {
            decrement: 1,
          },
        },
      }),
    ]);

    return NextResponse.json({ ok: true, deletedId: existingTask.id });
  } catch (error) {
    console.error("Failed to delete task", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
