import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getNextMeeting, saveNextMeeting } from "@/lib/meeting";

const meetingSchema = z.object({
  datetimeCetIso: z.string().min(1),
  agendaTaskIds: z.array(z.string()).default([]),
  optionalNotes: z.string().optional(),
});

export async function GET() {
  const meeting = await getNextMeeting();
  return NextResponse.json({ meeting });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = meetingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const meeting = await saveNextMeeting(parsed.data);

  return NextResponse.json({ meeting });
}
