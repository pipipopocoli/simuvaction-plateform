import crypto from "crypto";
import { DateTime } from "luxon";
import {
  RATE_LIMIT_MAX_FAILURES,
  RATE_LIMIT_WINDOW_MINUTES,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export function extractIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export async function checkRateLimit(ipHash: string): Promise<
  | { blocked: false }
  | { blocked: true; retryAfterSeconds: number }
> {
  const windowStart = DateTime.utc().minus({ minutes: RATE_LIMIT_WINDOW_MINUTES }).toJSDate();

  const recentFailures = await prisma.passphraseAttempt.findMany({
    where: {
      ipHash,
      success: false,
      attemptedAt: { gte: windowStart },
    },
    orderBy: { attemptedAt: "asc" },
  });

  if (recentFailures.length < RATE_LIMIT_MAX_FAILURES) {
    return { blocked: false };
  }

  const firstFailure = recentFailures[0]?.attemptedAt;
  if (!firstFailure) {
    return { blocked: true, retryAfterSeconds: RATE_LIMIT_WINDOW_MINUTES * 60 };
  }

  const unlockAt = DateTime.fromJSDate(firstFailure).plus({
    minutes: RATE_LIMIT_WINDOW_MINUTES,
  });
  const retryAfterSeconds = Math.max(1, Math.ceil(unlockAt.diffNow("seconds").seconds));

  return { blocked: true, retryAfterSeconds };
}

export async function recordPassphraseAttempt(ipHash: string, success: boolean) {
  await prisma.passphraseAttempt.create({
    data: {
      ipHash,
      success,
    },
  });
}
