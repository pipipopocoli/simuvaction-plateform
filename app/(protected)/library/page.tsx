import { LibraryManager } from "@/components/library-manager";
import { prisma } from "@/lib/prisma";

export default async function LibraryPage() {
  const [items, pillars, tasks] = await Promise.all([
    prisma.libraryItem.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.pillar.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.taskCard.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        pillar: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const serializedItems = items.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
  }));

  return (
    <LibraryManager
      initialItems={serializedItems}
      pillars={pillars}
      tasks={tasks.map((task) => ({
        id: task.id,
        title: task.title,
        pillarName: task.pillar.name,
      }))}
    />
  );
}
