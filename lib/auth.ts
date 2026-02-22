import { jwtVerify, SignJWT } from "jose";

function getSessionSecret(): Uint8Array {
  const secret = process.env["SESSION_SECRET"];
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  auth: true;
  userId: string;
  role: string;
  eventId: string;
  teamId?: string | null;
  iat?: number;
  exp?: number;
}

export async function createSessionJwt(
  userId: string,
  role: string,
  eventId: string,
  teamId?: string | null
): Promise<string> {
  return new SignJWT({ auth: true, userId, role, eventId, teamId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSessionSecret());
}

export async function verifySessionJwt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
    });

    if (payload.auth !== true) {
      return null;
    }

    return {
      auth: true,
      userId: payload.userId as string,
      role: payload.role as string,
      eventId: payload.eventId as string,
      teamId: payload.teamId as string | undefined,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
