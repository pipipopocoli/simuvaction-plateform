import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  CONSENT_POLICY_VERSION,
  getVisitorTokenFromRequest,
  setConsentCookie,
  setVisitorTokenCookie,
  upsertVisitorSession,
} from "@/lib/visitor-consent";

const consentSchema = z.object({
  status: z.enum(["granted", "denied"]),
  analyticsEnabled: z.boolean().optional(),
  policyVersion: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = consentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { token, isNew } = getVisitorTokenFromRequest(request);
  const status = parsed.data.status;
  const analyticsEnabled = parsed.data.analyticsEnabled ?? status === "granted";

  const visitorSession = await upsertVisitorSession({
    request,
    visitorToken: token,
    consentStatus: status,
    analyticsEnabled,
  });

  await prisma.consentLog.create({
    data: {
      eventId: visitorSession.eventId,
      userId: visitorSession.userId,
      sessionId: visitorSession.id,
      consentStatus: status,
      analyticsEnabled,
      policyVersion: parsed.data.policyVersion ?? CONSENT_POLICY_VERSION,
    },
  });

  const response = NextResponse.json({
    ok: true,
    status,
    analyticsEnabled,
  });

  if (isNew) {
    setVisitorTokenCookie(response, token);
  }
  setConsentCookie(response, status);

  return response;
}
