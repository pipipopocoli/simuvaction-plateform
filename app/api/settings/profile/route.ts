import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { createSessionJwt } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";

const optionalUrlField = z
  .union([z.string().trim().url(), z.literal(""), z.null()])
  .optional();

const optionalPhoneField = z
  .union([z.string().trim().max(40), z.literal(""), z.null()])
  .optional();

const profilePatchSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    avatarUrl: optionalUrlField,
    whatsAppNumber: optionalPhoneField,
    xUrl: optionalUrlField,
    linkedinUrl: optionalUrlField,
    positionPaperUrl: optionalUrlField,
    positionPaperSummary: z
      .union([z.string().trim().max(5000), z.literal(""), z.null()])
      .optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword && !value.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Current password is required to set a new password.",
        path: ["currentPassword"],
      });
    }

    if (!value.newPassword && value.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New password is required when current password is provided.",
        path: ["newPassword"],
      });
    }
  });

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { team: { select: { countryName: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      whatsAppNumber: user.whatsAppNumber,
      xUrl: user.xUrl,
      linkedinUrl: user.linkedinUrl,
      positionPaperUrl: user.positionPaperUrl,
      positionPaperSummary: user.positionPaperSummary,
      role: user.role,
      teamName: user.team?.countryName ?? null,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profilePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { team: { select: { countryName: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const {
    name,
    avatarUrl,
    whatsAppNumber,
    xUrl,
    linkedinUrl,
    positionPaperUrl,
    positionPaperSummary,
    currentPassword,
    newPassword,
  } = parsed.data;

  if (newPassword) {
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword ?? "", user.hashedPassword);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "Current password is invalid." }, { status: 401 });
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      avatarUrl: avatarUrl === undefined ? user.avatarUrl : avatarUrl || null,
      whatsAppNumber:
        whatsAppNumber === undefined ? user.whatsAppNumber : whatsAppNumber || null,
      xUrl: xUrl === undefined ? user.xUrl : xUrl || null,
      linkedinUrl:
        linkedinUrl === undefined ? user.linkedinUrl : linkedinUrl || null,
      positionPaperUrl:
        positionPaperUrl === undefined
          ? user.positionPaperUrl
          : positionPaperUrl || null,
      positionPaperSummary:
        positionPaperSummary === undefined
          ? user.positionPaperSummary
          : positionPaperSummary || null,
      ...(newPassword ? { hashedPassword: await bcrypt.hash(newPassword, 10) } : {}),
    },
    include: { team: { select: { countryName: true } } },
  });

  const sessionToken = await createSessionJwt({
    userId: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    role: updatedUser.role,
    teamId: updatedUser.teamId,
    eventId: updatedUser.eventId,
    avatarUrl: updatedUser.avatarUrl,
    mustChangePassword: updatedUser.mustChangePassword,
  });

  (await cookies()).set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({
    ok: true,
    passwordChanged: Boolean(newPassword),
    profile: {
      email: updatedUser.email,
      name: updatedUser.name,
      avatarUrl: updatedUser.avatarUrl,
      whatsAppNumber: updatedUser.whatsAppNumber,
      xUrl: updatedUser.xUrl,
      linkedinUrl: updatedUser.linkedinUrl,
      positionPaperUrl: updatedUser.positionPaperUrl,
      positionPaperSummary: updatedUser.positionPaperSummary,
      role: updatedUser.role,
      teamName: updatedUser.team?.countryName ?? null,
    },
  });
}
