import { LibraryItemType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const libraryItemSchema = z.object({
  type: z.nativeEnum(LibraryItemType),
  title: z.string().min(1),
  url: z.string().url(),
  tags: z.array(z.string()).default([]),
  pillarId: z.string().nullable().optional(),
  taskId: z.string().nullable().optional(),
});

const updateLibraryItemSchema = libraryItemSchema.partial().extend({
  id: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");

  const items = await prisma.libraryItem.findMany({
    where:
      type === "SOURCE" || type === "DRAFT"
        ? { type: type as LibraryItemType }
        : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = libraryItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.libraryItem.create({
    data: {
      type: parsed.data.type,
      title: parsed.data.title,
      url: parsed.data.url,
      tags: parsed.data.tags,
      pillarId: parsed.data.pillarId ?? null,
      taskId: parsed.data.taskId ?? null,
    },
  });

  return NextResponse.json({ item });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = updateLibraryItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...data } = parsed.data;

  const item = await prisma.libraryItem.update({
    where: { id },
    data: {
      ...data,
      pillarId: data.pillarId ?? null,
      taskId: data.taskId ?? null,
    },
  });

  return NextResponse.json({ item });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  await prisma.libraryItem.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
