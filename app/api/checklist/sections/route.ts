import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSectionSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createSectionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existingCount = await prisma.checklistSection.count({
    where: { taskId: parsed.data.taskId },
  });

  const section = await prisma.checklistSection.create({
    data: {
      taskId: parsed.data.taskId,
      title: parsed.data.title,
      orderIndex: existingCount,
    },
    include: {
      items: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  return NextResponse.json({ section });
}
