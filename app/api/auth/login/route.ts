import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionJwt } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  extractIpFromHeaders,
  hashIp,
  recordPassphraseAttempt,
} from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  pass: z.string().min(1).optional(),
  passphrase: z.string().min(1).optional(),
}).refine((value) => Boolean(value.pass || value.passphrase), {
  message: "Either pass or passphrase is required.",
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const { email, pass, passphrase } = parsed.data;

    // Rate limiting
    const ip = extractIpFromHeaders(request.headers);
    const ipHash = hashIp(ip);
    const rateLimit = await checkRateLimit(ipHash);

    if (rateLimit.blocked) {
      const response = NextResponse.json(
        { error: "Too many attempts. Try again later.", retryAfterSeconds: rateLimit.retryAfterSeconds },
        { status: 429 },
      );
      response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
      return response;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      await recordPassphraseAttempt(ipHash, false);
      return NextResponse.json({ error: "User not found for this email." }, { status: 404 });
    }

    let isAuthValid = false;

    if (pass) {
      isAuthValid = await bcrypt.compare(pass, user.hashedPassword);
    } else {
      const hashB64 = process.env["WARROOM_PASSPHRASE_BCRYPT_HASH_B64"];
      const decodedHash = hashB64 ? Buffer.from(hashB64, "base64").toString("utf8") : undefined;
      const bcryptHash =
        decodedHash ??
        process.env["WARROOM_PASSPHRASE_BCRYPT_HASH"] ??
        process.env["APP_PASSPHRASE_BCRYPT_HASH"];

      if (!bcryptHash) {
        return NextResponse.json(
          { error: "Server configuration error: global passphrase hash is missing." },
          { status: 500 },
        );
      }

      isAuthValid = await bcrypt.compare(passphrase ?? "", bcryptHash);
    }

    await recordPassphraseAttempt(ipHash, isAuthValid);
    if (!isAuthValid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const jwt = await createSessionJwt({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      teamId: user.teamId,
      eventId: user.eventId,
      mustChangePassword: user.mustChangePassword,
    });

    const response = NextResponse.json({
      ok: true,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: jwt,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    console.error("Login Crash:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
