import { Prisma, TaskStatus } from "@prisma/client";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { PARIS_TIMEZONE } from "@/lib/constants";
import {
  getCurrentParisNow,
  getCurrentParisWeekStart,
  toDisplayTimezoneRows,
} from "@/lib/timezones";
import type { WeeklyPlanItem } from "@/lib/types";

export interface WeeklyPlanResult {
  weekStartCet: Date;
  generatedAt: Date;
  markdownSummary: string;
  items: WeeklyPlanItem[];
}

function buildMarkdown(items: WeeklyPlanItem[]): string {
  if (items.length === 0) {
    return "No urgent activity this week. Keep momentum and update tasks regularly.";
  }

  return items
    .map((item) => {
      const rows = toDisplayTimezoneRows(item.dueIso);
      const timezoneLine = rows.map((row) => `${row.label}: ${row.value}`).join(" | ");
      const detailsLine = item.details ? `\n   Note: ${item.details}` : "";
      return `- ${item.title}\n   ${timezoneLine}${detailsLine}`;
    })
    .join("\n");
}

export async function computeWeeklyPlan(now = getCurrentParisNow()): Promise<WeeklyPlanResult> {
  const nowUtc = now.toUTC().toJSDate();
  const in7DaysUtc = now.plus({ days: 7 }).toUTC().toJSDate();
  const in14DaysUtc = now.plus({ days: 14 }).toUTC().toJSDate();

  const [officialDeadlines, dueTasks, urgentTasks, upcomingMeeting] = await Promise.all([
    prisma.officialDeadline.findMany({
      where: {
        datetimeCet: {
          gte: nowUtc,
          lte: in14DaysUtc,
        },
      },
      orderBy: { datetimeCet: "asc" },
    }),
    prisma.taskCard.findMany({
      where: {
        deadline: {
          gte: nowUtc,
          lte: in7DaysUtc,
        },
        status: { in: [TaskStatus.NEW, TaskStatus.DOING] },
      },
      orderBy: { deadline: "asc" },
    }),
    prisma.taskCard.findMany({
      where: {
        urgent: true,
        status: { notIn: [TaskStatus.DONE, TaskStatus.ARCHIVED] },
      },
      orderBy: [{ priority: "asc" }, { deadline: "asc" }],
    }),
    prisma.meeting.findFirst({
      where: {
        datetimeCet: {
          gte: nowUtc,
          lte: in7DaysUtc,
        },
      },
      orderBy: { datetimeCet: "asc" },
    }),
  ]);

  const items: WeeklyPlanItem[] = [];

  for (const deadline of officialDeadlines) {
    items.push({
      type: "official_deadline",
      title: `Official deadline: ${deadline.title}`,
      dueIso: deadline.datetimeCet.toISOString(),
    });
  }

  for (const task of dueTasks) {
    items.push({
      type: "task_due",
      title: `Task due: ${task.title}`,
      dueIso: task.deadline.toISOString(),
      details: `Priority ${task.priority}`,
      relatedTaskId: task.id,
    });
  }

  for (const task of urgentTasks) {
    items.push({
      type: "urgent_task",
      title: `Urgent task: ${task.title}`,
      dueIso: task.deadline.toISOString(),
      details: `Current status: ${task.status}`,
      relatedTaskId: task.id,
    });
  }

  if (upcomingMeeting) {
    items.push({
      type: "meeting",
      title: "Next meeting reminder",
      dueIso: upcomingMeeting.datetimeCet.toISOString(),
      details: upcomingMeeting.optionalNotes ?? "Agenda linked to selected tasks.",
    });
  }

  const weekStart = getCurrentParisWeekStart(now);

  return {
    weekStartCet: weekStart.toUTC().toJSDate(),
    generatedAt: nowUtc,
    markdownSummary: buildMarkdown(items),
    items,
  };
}

export async function generateOrUpdateWeeklyPlan(now = getCurrentParisNow()) {
  const result = await computeWeeklyPlan(now);
  const itemsJson = result.items as unknown as Prisma.InputJsonValue;

  return prisma.weeklyPlan.upsert({
    where: {
      weekStartCet: result.weekStartCet,
    },
    update: {
      generatedAt: result.generatedAt,
      markdownSummary: result.markdownSummary,
      itemsJson,
    },
    create: {
      weekStartCet: result.weekStartCet,
      generatedAt: result.generatedAt,
      markdownSummary: result.markdownSummary,
      itemsJson,
    },
  });
}

export async function ensureWeeklyPlanForCurrentWeek(now = getCurrentParisNow()) {
  const weekStart = getCurrentParisWeekStart(now).toUTC().toJSDate();

  const existing = await prisma.weeklyPlan.findUnique({
    where: { weekStartCet: weekStart },
  });

  const monday0900 = now.startOf("week").set({ hour: 9, minute: 0, second: 0, millisecond: 0 });

  if (!existing && now >= monday0900) {
    return generateOrUpdateWeeklyPlan(now);
  }

  return existing;
}

export function formatParisIsoForInput(utcDate: Date): string {
  return DateTime.fromJSDate(utcDate).setZone(PARIS_TIMEZONE).toFormat("yyyy-LL-dd'T'HH:mm");
}
