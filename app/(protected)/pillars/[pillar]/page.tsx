import { notFound } from "next/navigation";
import { PillarBoard } from "@/components/pillar-board";
import { prisma } from "@/lib/prisma";

export default async function PillarBoardPage({
  params,
}: {
  params: Promise<{ pillar: string }>;
}) {
  const { pillar: slug } = await params;

  const pillar = await prisma.pillar.findUnique({
    where: { slug },
  });

  if (!pillar) {
    notFound();
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
    prisma.tag.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedTasks = tasks.map((task) => ({
    ...task,
    deadline: task.deadline.toISOString(),
  }));

  return <PillarBoard pillar={pillar} initialTasks={serializedTasks} tags={tags} />;
}
