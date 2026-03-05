import crypto from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractIpFromHeaders, hashIp } from "@/lib/rate-limit";
import { getUserSession } from "@/lib/server-auth";

export const VISITOR_COOKIE_NAME = "simuvaction_visitor";
export const CONSENT_COOKIE_NAME = "simuvaction_consent";
export const CONSENT_POLICY_VERSION = "2026-03-05";

export type ConsentStatus = "granted" | "denied" | "unknown";

function sha256Hex(rawValue: string): string {
  return crypto.createHash("sha256").update(rawValue).digest("hex");
}

export function getVisitorTokenFromRequest(request: NextRequest): {
  token: string;
  isNew: boolean;
} {
  const existing = request.cookies.get(VISITOR_COOKIE_NAME)?.value;
  if (existing) {
    return { token: existing, isNew: false };
  }

  return { token: crypto.randomUUID(), isNew: true };
}

export function getConsentStatusFromRequest(request: NextRequest): ConsentStatus {
  const cookieValue = request.cookies.get(CONSENT_COOKIE_NAME)?.value;
  if (cookieValue === "granted" || cookieValue === "denied") {
    return cookieValue;
  }
  return "unknown";
}

export function setVisitorTokenCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: VISITOR_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function setConsentCookie(response: NextResponse, status: Exclude<ConsentStatus, "unknown">) {
  response.cookies.set({
    name: CONSENT_COOKIE_NAME,
    value: status,
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

type UpsertSessionOptions = {
  request: NextRequest;
  visitorToken: string;
  consentStatus?: ConsentStatus;
  analyticsEnabled?: boolean;
};

export async function upsertVisitorSession({
  request,
  visitorToken,
  consentStatus = "unknown",
  analyticsEnabled = false,
}: UpsertSessionOptions) {
  const session = await getUserSession().catch(() => null);
  const sessionKey = sha256Hex(visitorToken);
  const ipHash = hashIp(extractIpFromHeaders(request.headers));
  const userAgent = request.headers.get("user-agent");
  const referrer = request.headers.get("referer");

  return prisma.visitorSession.upsert({
    where: { sessionKey },
    update: {
      eventId: session?.eventId ?? null,
      userId: session?.userId ?? null,
      consentStatus,
      analyticsEnabled,
      policyVersion: CONSENT_POLICY_VERSION,
      ipHash,
      userAgent,
      referrer,
      lastSeenAt: new Date(),
    },
    create: {
      eventId: session?.eventId ?? null,
      userId: session?.userId ?? null,
      sessionKey,
      consentStatus,
      analyticsEnabled,
      policyVersion: CONSENT_POLICY_VERSION,
      ipHash,
      userAgent,
      referrer,
    },
  });
}
