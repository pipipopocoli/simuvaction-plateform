import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { PARIS_TIMEZONE } from "@/lib/constants";

export async function getNextMeeting() {
  const nowUtc = new Date();

  const upcoming = await prisma.meeting.findFirst({
    where: {
      datetimeCet: { gte: nowUtc },
    },
    orderBy: { datetimeCet: "asc" },
  });

  if (upcoming) {
    return upcoming;
  }

  return prisma.meeting.findFirst({
    orderBy: { datetimeCet: "desc" },
  });
}

export async function saveNextMeeting(input: {
  datetimeCetIso: string;
  agendaTaskIds: string[];
  optionalNotes?: string;
}) {
  const utcDate = DateTime.fromISO(input.datetimeCetIso, {
    zone: PARIS_TIMEZONE,
  }).toUTC().toJSDate();

  const existing = await prisma.meeting.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!existing) {
    return prisma.meeting.create({
      data: {
        datetimeCet: utcDate,
        agendaTaskIdsJson: input.agendaTaskIds,
        optionalNotes: input.optionalNotes,
      },
    });
  }

  return prisma.meeting.update({
    where: { id: existing.id },
    data: {
      datetimeCet: utcDate,
      agendaTaskIdsJson: input.agendaTaskIds,
      optionalNotes: input.optionalNotes,
    },
  });
}
