import { DateTime } from "luxon";
import type { PrismaClient } from "@prisma/client";
import { resolveRecipientUserIds, uniqueIds } from "@/lib/communications";
import { resolveUserTimeZone } from "@/lib/user-timezone";

export type MeetingAvailabilityParticipant = {
  id: string;
  name: string;
  role: string;
  teamName: string | null;
  preferredTimeZone: string;
  isOrganizer: boolean;
};

export type MeetingAvailabilitySlot = {
  startsAt: string;
  endsAt: string;
  participantTimes: Array<{
    userId: string;
    name: string;
    timeZone: string;
    localStart: string;
    localEnd: string;
  }>;
};

function roundUpToNextHalfHour(value: DateTime) {
  const normalized = value.set({ second: 0, millisecond: 0 });
  const remainder = normalized.minute % 30;

  if (remainder === 0 && value.second === 0 && value.millisecond === 0) {
    return normalized;
  }

  return normalized.plus({ minutes: remainder === 0 ? 30 : 30 - remainder }).set({
    second: 0,
    millisecond: 0,
  });
}

function isWithinParticipantWindow(startsAtUtc: DateTime, endsAtUtc: DateTime, timeZone: string) {
  const localStart = startsAtUtc.setZone(timeZone);
  const localEnd = endsAtUtc.setZone(timeZone);
  const startMinutes = localStart.hour * 60 + localStart.minute;
  const endMinutes = localEnd.hour * 60 + localEnd.minute;

  return (
    localStart.isValid &&
    localEnd.isValid &&
    localStart.hasSame(localEnd, "day") &&
    startMinutes >= 8 * 60 &&
    endMinutes <= 22 * 60
  );
}

export async function resolveMeetingAvailability(
  prisma: PrismaClient,
  args: {
    eventId: string;
    requesterId: string;
    recipientMode: "individual" | "team" | "group";
    targetUserId?: string | null;
    targetTeamId?: string | null;
    attendeeIds?: string[];
    durationMin: number;
    organizerTimeZone?: string | null;
    rangeStartDate?: string | null;
    rangeDays?: number;
  },
) {
  const attendeeUserIds = await resolveRecipientUserIds(prisma, {
    eventId: args.eventId,
    requesterId: args.requesterId,
    targetUserId: args.targetUserId,
    targetTeamId: args.targetTeamId,
    participantIds: args.attendeeIds,
  });

  if (attendeeUserIds.length === 0) {
    throw new Error("At least one attendee is required.");
  }

  const participantIds = uniqueIds([args.requesterId, ...attendeeUserIds]);
  const users = await prisma.user.findMany({
    where: {
      eventId: args.eventId,
      id: { in: participantIds },
    },
    select: {
      id: true,
      name: true,
      role: true,
      preferredTimeZone: true,
      team: {
        select: {
          countryCode: true,
          countryName: true,
        },
      },
    },
  });

  const userMap = new Map(users.map((user) => [user.id, user]));
  const organizer = userMap.get(args.requesterId);
  if (!organizer) {
    throw new Error("Organizer not found.");
  }

  const participants: MeetingAvailabilityParticipant[] = participantIds
    .map((participantId) => userMap.get(participantId))
    .filter((participant): participant is NonNullable<typeof participant> => Boolean(participant))
    .map((participant) => ({
      id: participant.id,
      name: participant.name,
      role: participant.role,
      teamName: participant.team?.countryName ?? null,
      preferredTimeZone: resolveUserTimeZone(
        participant.preferredTimeZone,
        participant.team?.countryCode,
      ),
      isOrganizer: participant.id === args.requesterId,
    }));

  const organizerTimeZone = resolveUserTimeZone(
    args.organizerTimeZone ?? organizer.preferredTimeZone,
    organizer.team?.countryCode,
  );

  const rangeDays = Math.min(Math.max(args.rangeDays ?? 7, 1), 14);
  const nowInOrganizerZone = DateTime.now().setZone(organizerTimeZone);
  const explicitRangeStart = args.rangeStartDate
    ? DateTime.fromISO(args.rangeStartDate, { zone: organizerTimeZone })
    : null;
  const rangeStart = explicitRangeStart?.isValid
    ? roundUpToNextHalfHour(explicitRangeStart)
    : roundUpToNextHalfHour(nowInOrganizerZone);
  const rangeBase = rangeStart.startOf("day");

  const suggestedSlots: MeetingAvailabilitySlot[] = [];

  for (let dayOffset = 0; dayOffset < rangeDays; dayOffset += 1) {
    const dayStart = rangeBase.plus({ days: dayOffset });
    const firstCandidate = dayOffset === 0 && rangeStart > dayStart ? rangeStart : dayStart;
    let candidate = roundUpToNextHalfHour(firstCandidate);
    const dayEnd = dayStart.endOf("day");

    while (candidate <= dayEnd) {
      const candidateEnd = candidate.plus({ minutes: args.durationMin });
      if (candidateEnd > dayEnd.plus({ minutes: 1 })) {
        break;
      }

      const participantTimes = participants.map((participant) => {
        const localStart = candidate.setZone(participant.preferredTimeZone);
        const localEnd = candidateEnd.setZone(participant.preferredTimeZone);

        return {
          userId: participant.id,
          name: participant.name,
          timeZone: participant.preferredTimeZone,
          localStart: localStart.toFormat("EEE dd LLL, HH:mm"),
          localEnd: localEnd.toFormat("HH:mm"),
          isValid: isWithinParticipantWindow(candidate, candidateEnd, participant.preferredTimeZone),
        };
      });

      if (participantTimes.every((entry) => entry.isValid)) {
        suggestedSlots.push({
          startsAt: candidate.toUTC().toISO() ?? candidate.toISO() ?? "",
          endsAt: candidateEnd.toUTC().toISO() ?? candidateEnd.toISO() ?? "",
          participantTimes: participantTimes.map(({ isValid: _isValid, ...entry }) => entry),
        });
      }

      candidate = candidate.plus({ minutes: 30 });
    }
  }

  return {
    organizerTimeZone,
    participants,
    suggestedSlots,
  };
}
