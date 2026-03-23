import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android", "web"]),
  deviceName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { token, platform, deviceName } = parsed.data;

  // Upsert device token — one token per device per user
  await prisma.userDeviceToken.upsert({
    where: {
      userId_token: {
        userId: session.userId,
        token,
      },
    },
    update: {
      platform,
      lastSeenAt: new Date(),
    },
    create: {
      userId: session.userId,
      token,
      platform,
    },
  });

  return NextResponse.json({ ok: true });
}
