import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getConsentStatusFromRequest,
  getVisitorTokenFromRequest,
  setVisitorTokenCookie,
  upsertVisitorSession,
} from "@/lib/visitor-consent";

const eventSchema = z.object({
  eventType: z.string().min(2).max(80),
  pagePath: z.string().min(1).max(300),
  referrer: z.string().max(500).optional().nullable(),
  dwellMs: z.number().int().min(0).max(1000 * 60 * 60).optional().nullable(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export async function POST(request: NextRequest) {
  const consentStatus = getConsentStatusFromRequest(request);
  if (consentStatus !== "granted") {
    return NextResponse.json({ tracked: false, reason: "consent_not_granted" }, { status: 202 });
  }

  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { token, isNew } = getVisitorTokenFromRequest(request);
  const visitorSession = await upsertVisitorSession({
    request,
    visitorToken: token,
    consentStatus: "granted",
    analyticsEnabled: true,
  });

  await prisma.visitorEvent.create({
    data: {
      eventId: visitorSession.eventId,
      userId: visitorSession.userId,
      sessionId: visitorSession.id,
      eventType: parsed.data.eventType,
      pagePath: parsed.data.pagePath,
      referrer: parsed.data.referrer ?? null,
      dwellMs: parsed.data.dwellMs ?? null,
      metadata: parsed.data.metadata ?? {},
    },
  });

  const response = NextResponse.json({ tracked: true });
  if (isNew) {
    setVisitorTokenCookie(response, token);
  }

  return response;
}
