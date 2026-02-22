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
  passphrase: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { email, passphrase } = parsed.data;

  // Rate limiting
  const ip = extractIpFromHeaders(request.headers);
  const ipHash = hashIp(ip);
  const rateLimit = await checkRateLimit(ipHash);

  if (rateLimit.blocked) {
    const response = NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard.", retryAfterSeconds: rateLimit.retryAfterSeconds },
      { status: 429 },
    );
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

  // Check global passphrase
  const hashB64 = process.env["WARROOM_PASSPHRASE_BCRYPT_HASH_B64"];
  const decodedHash = hashB64 ? Buffer.from(hashB64, "base64").toString("utf8") : undefined;
  const bcryptHash = decodedHash ?? process.env["WARROOM_PASSPHRASE_BCRYPT_HASH"] ?? process.env["APP_PASSPHRASE_BCRYPT_HASH"];

  if (!bcryptHash) {
    return NextResponse.json({ error: "Erreur de configuration du serveur : le mot de passe global est manquant." }, { status: 500 });
  }

  const isPassphraseValid = await bcrypt.compare(passphrase, bcryptHash);
  await recordPassphraseAttempt(ipHash, isPassphraseValid);

  if (!isPassphraseValid) {
    return NextResponse.json({ error: "Passphrase global incorrect." }, { status: 401 });
  }

  // Lookup user in DB
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé avec cet email." }, { status: 404 });
  }

  // Create token with role-based auth payload
  const jwt = await createSessionJwt(user.id, user.role, user.eventId, user.teamId);

  const response = NextResponse.json({ ok: true, role: user.role });

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
}
