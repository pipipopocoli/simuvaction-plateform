import { TaskStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const moveSchema = z.object({
  status: z.nativeEnum(TaskStatus),
  orderIndex: z.number().int().min(0).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = moveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const task = await prisma.taskCard.update({
    where: { id },
    data: {
      status: parsed.data.status,
      ...(parsed.data.orderIndex !== undefined
        ? { orderIndex: parsed.data.orderIndex }
        : {}),
    },
  });

  return NextResponse.json({ task });
}
