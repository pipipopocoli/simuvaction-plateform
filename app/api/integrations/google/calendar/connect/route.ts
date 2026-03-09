import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleCalendarAuthUrl,
  connectGoogleCalendarForUser,
  isGoogleCalendarConfigured,
} from "@/lib/google-calendar";
import { getUserSession } from "@/lib/server-auth";

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json({ error: "Google Calendar integration is not configured." }, { status: 503 });
  }

  const state = Buffer.from(`${session.userId}:${session.eventId}`).toString("base64url");
  const authUrl = buildGoogleCalendarAuthUrl(state);

  return NextResponse.json({ authUrl });
}

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as { code?: string } | null;
  if (!payload?.code) {
    return NextResponse.json({ error: "Authorization code is required." }, { status: 400 });
  }

  try {
    const connection = await connectGoogleCalendarForUser(
      session.userId,
      session.eventId,
      payload.code,
    );

    return NextResponse.json({
      ok: true,
      accountEmail: connection.providerAccountEmail,
      updatedAt: connection.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Google calendar connect failed", error);
    return NextResponse.json({ error: "Unable to connect Google Calendar." }, { status: 500 });
  }
}
