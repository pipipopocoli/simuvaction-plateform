import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const e164Regex = /^\+[1-9]\d{1,14}$/;

const settingsSchema = z.object({
  numbers: z.array(z.string().regex(e164Regex, "Must be valid E.164 numbers.")),
  metaToken: z.string(),
  metaPhoneNumberId: z.string(),
  enabled: z.boolean(),
});

const defaultValue = {
  numbers: [],
  metaToken: "",
  metaPhoneNumberId: "",
  enabled: false,
};

export async function GET() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: "whatsapp" },
  });

  if (!setting) {
    return NextResponse.json({
      setting: defaultValue,
    });
  }

  return NextResponse.json({
    setting: setting.valueJson,
  });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const setting = await prisma.appSetting.upsert({
    where: { key: "whatsapp" },
    update: {
      valueJson: parsed.data,
    },
    create: {
      key: "whatsapp",
      valueJson: parsed.data,
    },
  });

  return NextResponse.json({ setting: setting.valueJson });
}
