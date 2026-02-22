import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createItemSchema = z.object({
  sectionId: z.string().min(1),
  text: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existingCount = await prisma.checklistItem.count({
    where: { sectionId: parsed.data.sectionId },
  });

  const item = await prisma.checklistItem.create({
    data: {
      sectionId: parsed.data.sectionId,
      text: parsed.data.text,
      orderIndex: existingCount,
      isDone: false,
    },
  });

  return NextResponse.json({ item });
}
