import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const pillar = await prisma.pillar.findUnique({
    where: { slug },
  });

  if (!pillar) {
    return NextResponse.json({ error: "Pillar not found." }, { status: 404 });
  }

  const [tasks, tags] = await Promise.all([
    prisma.taskCard.findMany({
      where: { pillarId: pillar.id },
      orderBy: [{ status: "asc" }, { orderIndex: "asc" }],
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        checklistSections: {
          orderBy: { orderIndex: "asc" },
          include: {
            items: {
              orderBy: { orderIndex: "asc" },
            },
          },
        },
        attachments: {
          orderBy: { title: "asc" },
        },
      },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({
    pillar,
    tags,
    tasks,
  });
}
