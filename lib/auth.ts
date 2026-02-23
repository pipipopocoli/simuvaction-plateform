import { jwtVerify, SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const fallbackSecret = "Simuvaction2026-Super-Secret-Token-Infaillible-Fallback-Key-1234567890";
const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || fallbackSecret
);

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  teamId: string | null;
  eventId: string;
  mustChangePassword?: boolean;
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);
}

export async function decrypt(token: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function loginUser(email: string, pass: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user) {
    return { error: "Identifiants incorrects." };
  }

  const isValid = await bcrypt.compare(pass, user.hashedPassword);
  if (!isValid) {
    return { error: "Identifiants incorrects." };
  }

  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    teamId: user.teamId,
    eventId: user.eventId,
    mustChangePassword: user.mustChangePassword,
  };

  const sessionToken = await encrypt(payload);

  (await cookies()).set("session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return { success: true, user: payload };
}
