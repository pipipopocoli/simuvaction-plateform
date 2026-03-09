import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import { resolveMeetingAvailability } from "@/lib/meeting-availability";

const meetingAvailabilitySchema = z.object({
  recipientMode: z.enum(["individual", "team", "group"]),
  targetUserId: z.string().min(1).optional(),
  targetTeamId: z.string().min(1).optional(),
  attendeeIds: z.array(z.string().min(1)).optional(),
  durationMin: z.number().int().min(10).max(240),
  rangeStartDate: z.string().trim().min(4).optional(),
  rangeDays: z.number().int().min(1).max(14).optional(),
  organizerTimeZone: z.string().trim().min(2).max(80),
});

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = meetingAvailabilitySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const availability = await resolveMeetingAvailability(prisma, {
      eventId: session.eventId,
      requesterId: session.userId,
      ...parsed.data,
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error("POST /api/meetings/availability error:", error);
    if (error instanceof Error && error.message === "At least one attendee is required.") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to compute meeting availability." },
      { status: 500 },
    );
  }
}
