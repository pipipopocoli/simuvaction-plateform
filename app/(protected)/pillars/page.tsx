import Link from "next/link";
import { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatInZone } from "@/lib/timezones";

export default async function PillarsPage() {
  const pillars = await prisma.pillar.findMany({
    orderBy: { name: "asc" },
    include: {
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          deadline: true,
          priority: true,
          urgent: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold">Pillars Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Trello-lite overview of all five Simuvaction work pillars.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pillars.map((pillar) => {
          const nextDue = pillar.tasks
            .filter((task) => task.status !== TaskStatus.DONE && task.status !== TaskStatus.ARCHIVED)
            .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())[0]?.deadline;

          const stats = {
            new: pillar.tasks.filter((task) => task.status === TaskStatus.NEW).length,
            doing: pillar.tasks.filter((task) => task.status === TaskStatus.DOING).length,
            done: pillar.tasks.filter((task) => task.status === TaskStatus.DONE).length,
          };

          const tasksToDo = pillar.tasks
            .filter((task) => task.status === TaskStatus.NEW || task.status === TaskStatus.DOING)
            .sort((a, b) => {
              const deadlineDiff = a.deadline.getTime() - b.deadline.getTime();
              if (deadlineDiff !== 0) {
                return deadlineDiff;
              }
              return a.priority - b.priority;
            });

          const topTasksToDo = tasksToDo.slice(0, 5);
          const remainingTasksToDoCount = Math.max(0, tasksToDo.length - topTasksToDo.length);

          return (
            <Link
              key={pillar.id}
              href={`/pillars/${pillar.slug}`}
              className="card-panel rounded-lg p-5 transition hover:border-zinc-500 hover:bg-zinc-100"
            >
              <p className="text-lg font-semibold">{pillar.name}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div className="rounded border border-zinc-300 bg-white p-2">
                  <p className="text-zinc-500">New</p>
                  <p className="text-xl font-medium">{stats.new}</p>
                </div>
                <div className="rounded border border-zinc-300 bg-white p-2">
                  <p className="text-zinc-500">Doing</p>
                  <p className="text-xl font-medium">{stats.doing}</p>
                </div>
                <div className="rounded border border-zinc-300 bg-white p-2">
                  <p className="text-zinc-500">Done</p>
                  <p className="text-xl font-medium">{stats.done}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-zinc-600">
                Next due: {nextDue ? formatInZone(nextDue, "Europe/Paris") : "No upcoming due date"}
              </p>

              <div className="mt-4 rounded border border-zinc-300 bg-zinc-50 p-3">
                <p className="text-sm font-medium text-zinc-800">To do: {tasksToDo.length}</p>

                {topTasksToDo.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {topTasksToDo.map((task) => (
                      <div key={task.id} className="rounded border border-zinc-300 bg-white p-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-medium text-zinc-900">{task.title}</p>
                          <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-100">
                            P{task.priority}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-zinc-600">
                          Due: {formatInZone(task.deadline, "Europe/Paris")}
                        </p>

                        {task.urgent ? <p className="mt-1 text-xs text-red-700">⚠ Urgent</p> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-zinc-500">No tasks to do</p>
                )}

                {remainingTasksToDoCount > 0 ? (
                  <p className="mt-2 text-xs text-zinc-500">+{remainingTasksToDoCount} more</p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
