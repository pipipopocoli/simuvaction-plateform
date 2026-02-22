import { NextResponse } from "next/server";
import { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const pillars = await prisma.pillar.findMany({
    orderBy: { name: "asc" },
    include: {
      tasks: {
        select: {
          status: true,
          deadline: true,
        },
      },
    },
  });

  const data = pillars.map((pillar) => {
    const nextDue = pillar.tasks
      .filter((task) => task.status !== TaskStatus.DONE && task.status !== TaskStatus.ARCHIVED)
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())[0]?.deadline;

    const stats = {
      new: pillar.tasks.filter((task) => task.status === TaskStatus.NEW).length,
      doing: pillar.tasks.filter((task) => task.status === TaskStatus.DOING).length,
      done: pillar.tasks.filter((task) => task.status === TaskStatus.DONE).length,
    };

    return {
      id: pillar.id,
      name: pillar.name,
      slug: pillar.slug,
      stats,
      nextDue,
    };
  });

  return NextResponse.json({ pillars: data });
}
