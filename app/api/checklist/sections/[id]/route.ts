import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateSectionSchema = z.object({
  title: z.string().min(1).optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSectionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const section = await prisma.checklistSection.update({
    where: { id },
    data: parsed.data,
    include: {
      items: { orderBy: { orderIndex: "asc" } },
    },
  });

  return NextResponse.json({ section });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  await prisma.checklistSection.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
