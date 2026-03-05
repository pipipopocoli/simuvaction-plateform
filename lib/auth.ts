import { jwtVerify, SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

function getSecretKey(): Uint8Array {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be set with at least 32 characters.");
  }

  return new TextEncoder().encode(sessionSecret);
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  teamId: string | null;
  eventId: string;
  avatarUrl?: string | null;
  mustChangePassword?: boolean;
}

export async function createSessionJwt(payload: SessionPayload): Promise<string> {
  const secretKey = getSecretKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifySessionJwt(token: string | undefined = ""): Promise<SessionPayload | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function encrypt(payload: SessionPayload) {
  return createSessionJwt(payload);
}

export async function decrypt(token: string | undefined = "") {
  return verifySessionJwt(token);
}

export async function loginUser(email: string, pass: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      hashedPassword: true,
      mustChangePassword: true,
      name: true,
      role: true,
      teamId: true,
      eventId: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    return { error: "Invalid credentials." };
  }

  const isValid = await bcrypt.compare(pass, user.hashedPassword);
  if (!isValid) {
    return { error: "Invalid credentials." };
  }

  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    teamId: user.teamId,
    eventId: user.eventId,
    avatarUrl: user.avatarUrl,
    mustChangePassword: user.mustChangePassword,
  };

  const sessionToken = await createSessionJwt(payload);

  (await cookies()).set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { success: true, user: payload };
}
