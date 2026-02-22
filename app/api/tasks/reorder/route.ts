import { TaskStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const reorderSchema = z.object({
  status: z.nativeEnum(TaskStatus),
  orderedTaskIds: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.orderedTaskIds.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const updates = parsed.data.orderedTaskIds.map((taskId, index) =>
    prisma.taskCard.update({
      where: { id: taskId },
      data: {
        status: parsed.data.status,
        orderIndex: index,
      },
    }),
  );

  await prisma.$transaction(updates);

  return NextResponse.json({ ok: true });
}
