import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import { buildVideoRoomName } from "@/lib/video-room";
import { createGoogleCalendarEventForUser } from "@/lib/google-calendar";

const createPressConferenceSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(3000).optional(),
  scheduledStartAt: z.string().datetime(),
  scheduledEndAt: z.string().datetime(),
  organizerTimeZone: z.string().trim().min(2).max(80).optional(),
  speakerIds: z.array(z.string().min(1)).default([]),
  googleMeetRequested: z.boolean().default(false),
});

const patchPressConferenceSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["scheduled", "live", "completed", "cancelled"]).optional(),
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(3000).optional(),
  scheduledStartAt: z.string().datetime().optional(),
  scheduledEndAt: z.string().datetime().optional(),
  speakerIds: z.array(z.string().min(1)).optional(),
});

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conferences = await prisma.pressConference.findMany({
    where: { eventId: session.eventId },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              displayRole: true,
              mediaOutlet: true,
            },
          },
        },
      },
    },
    orderBy: [{ scheduledStartAt: "asc" }],
  });

  return NextResponse.json(
    conferences.map((conference) => ({
      ...conference,
      scheduledStartAt: conference.scheduledStartAt.toISOString(),
      scheduledEndAt: conference.scheduledEndAt.toISOString(),
      createdAt: conference.createdAt.toISOString(),
      updatedAt: conference.updatedAt.toISOString(),
      joinPath: `/press-conferences/${conference.id}`,
    })),
  );
}

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = createPressConferenceSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const startsAt = new Date(parsed.data.scheduledStartAt);
  const endsAt = new Date(parsed.data.scheduledEndAt);
  if (endsAt <= startsAt) {
    return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
  }

  const speakerIds = Array.from(
    new Set([session.userId, ...parsed.data.speakerIds.filter((id) => id !== session.userId)]),
  );
  const speakers = await prisma.user.findMany({
    where: { eventId: session.eventId, id: { in: speakerIds } },
    select: { id: true, email: true },
  });

  if (speakers.length !== speakerIds.length) {
    return NextResponse.json({ error: "One or more speakers were not found in this event." }, { status: 404 });
  }

  if (parsed.data.organizerTimeZone) {
    await prisma.user.update({
      where: { id: session.userId },
      data: { preferredTimeZone: parsed.data.organizerTimeZone },
    });
  }

  let googleCalendarResult: { googleMeetUrl: string | null; calendarEventId: string | null } | null =
    null;
  if (parsed.data.googleMeetRequested) {
    try {
      googleCalendarResult = await createGoogleCalendarEventForUser({
        userId: session.userId,
        summary: parsed.data.title,
        description: parsed.data.description ?? null,
        startsAt,
        endsAt,
        timeZone: parsed.data.organizerTimeZone ?? "UTC",
        attendeeEmails: speakers.map((speaker) => speaker.email),
      });
    } catch (error) {
      console.error("Google press conference event creation failed", error);
    }
  }

  const conference = await prisma.pressConference.create({
    data: {
      eventId: session.eventId,
      createdById: session.userId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      scheduledStartAt: startsAt,
      scheduledEndAt: endsAt,
      organizerTimeZone: parsed.data.organizerTimeZone || null,
      videoRoomName: buildVideoRoomName("press", crypto.randomUUID(), parsed.data.title),
      googleMeetUrl: googleCalendarResult?.googleMeetUrl ?? null,
      googleCalendarEventId: googleCalendarResult?.calendarEventId ?? null,
      participants: {
        create: speakers.map((speaker) => ({
          userId: speaker.id,
          role: speaker.id === session.userId ? "host" : "speaker",
        })),
      },
    },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              displayRole: true,
              mediaOutlet: true,
            },
          },
        },
      },
    },
  });

  const recipients = await prisma.user.findMany({
    where: { eventId: session.eventId, id: { not: session.userId } },
    select: { id: true },
  });

  await prisma.notification.createMany({
    data: recipients.map((user) => ({
      eventId: session.eventId,
      userId: user.id,
      type: "press_conference",
      title: "Press conference scheduled",
      body: `${conference.title} is scheduled for ${conference.scheduledStartAt.toISOString()}`,
      deepLink: `/press-conferences/${conference.id}`,
      priority: "normal",
    })),
    skipDuplicates: true,
  });

  return NextResponse.json(
    {
      ...conference,
      scheduledStartAt: conference.scheduledStartAt.toISOString(),
      scheduledEndAt: conference.scheduledEndAt.toISOString(),
      createdAt: conference.createdAt.toISOString(),
      updatedAt: conference.updatedAt.toISOString(),
      joinPath: `/press-conferences/${conference.id}`,
    },
    { status: 201 },
  );
}

export async function PATCH(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = patchPressConferenceSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const conference = await prisma.pressConference.findFirst({
    where: { id: parsed.data.id, eventId: session.eventId },
    include: { participants: true },
  });

  if (!conference) {
    return NextResponse.json({ error: "Press conference not found." }, { status: 404 });
  }

  const isHost =
    conference.createdById === session.userId ||
    conference.participants.some(
      (participant) => participant.userId === session.userId && participant.role === "host",
    );
  if (!isHost) {
    return NextResponse.json({ error: "Only hosts can update this press conference." }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status) updateData.status = parsed.data.status;
  if (parsed.data.title) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description || null;
  if (parsed.data.scheduledStartAt) updateData.scheduledStartAt = new Date(parsed.data.scheduledStartAt);
  if (parsed.data.scheduledEndAt) updateData.scheduledEndAt = new Date(parsed.data.scheduledEndAt);

  if (parsed.data.speakerIds) {
    const speakerIds = Array.from(new Set([session.userId, ...parsed.data.speakerIds]));
    updateData.participants = {
      deleteMany: {},
      create: speakerIds.map((speakerId) => ({
        userId: speakerId,
        role: speakerId === session.userId ? "host" : "speaker",
      })),
    };
  }

  const updated = await prisma.pressConference.update({
    where: { id: conference.id },
    data: updateData,
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              displayRole: true,
              mediaOutlet: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    ...updated,
    scheduledStartAt: updated.scheduledStartAt.toISOString(),
    scheduledEndAt: updated.scheduledEndAt.toISOString(),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    joinPath: `/press-conferences/${updated.id}`,
  });
}
