import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import { isAdminLike } from "@/lib/authz";
import {
  isBlobConfigured,
  MAX_DOCUMENT_SIZE_BYTES,
  sanitizeFileName,
  uploadEventFile,
} from "@/lib/blob-storage";

const createTeamLibraryItemSchema = z.object({
  teamId: z.string().min(1).optional(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional(),
  url: z.string().trim().url().optional(),
  fileType: z.string().trim().min(1).max(40).default("file"),
});

async function parsePayload(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return {
      parsed: createTeamLibraryItemSchema.safeParse({
        teamId: String(formData.get("teamId") ?? "").trim() || undefined,
        title: String(formData.get("title") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim() || undefined,
        url: String(formData.get("url") ?? "").trim() || undefined,
        fileType: String(formData.get("fileType") ?? "file").trim(),
      }),
      file: formData.get("file") instanceof File ? (formData.get("file") as File) : null,
    };
  }

  const json = await request.json().catch(() => null);
  return {
    parsed: createTeamLibraryItemSchema.safeParse(json),
    file: null,
  };
}

export async function GET(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestedTeamId = request.nextUrl.searchParams.get("teamId");
  const effectiveTeamId = requestedTeamId || session.teamId;

  if (!effectiveTeamId && !isAdminLike(session.role)) {
    return NextResponse.json({ error: "No team library is available for this user." }, { status: 400 });
  }

  const where = isAdminLike(session.role)
    ? {
        eventId: session.eventId,
        ...(effectiveTeamId ? { teamId: effectiveTeamId } : {}),
      }
    : {
        eventId: session.eventId,
        teamId: session.teamId ?? "__missing__",
      };

  const items = await prisma.teamLibraryItem.findMany({
    where,
    include: {
      team: { select: { id: true, countryCode: true, countryName: true } },
      createdBy: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { parsed, file } = await parsePayload(request);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const teamId = parsed.data.teamId ?? session.teamId;
  if (!teamId) {
    return NextResponse.json({ error: "A target team is required." }, { status: 400 });
  }

  if (!isAdminLike(session.role) && teamId !== session.teamId) {
    return NextResponse.json({ error: "You can only upload to your own team library." }, { status: 403 });
  }

  const team = await prisma.team.findFirst({
    where: { id: teamId, eventId: session.eventId },
    select: { id: true, countryCode: true },
  });

  if (!team) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  let fileUrl = parsed.data.url ?? null;
  let fileName: string | null = null;
  let mimeType: string | null = null;
  let fileSizeBytes: number | null = null;

  if (file) {
    if (!isBlobConfigured()) {
      return NextResponse.json({ error: "Blob storage is not configured." }, { status: 500 });
    }
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      return NextResponse.json({ error: "File is too large (max 15MB)." }, { status: 400 });
    }
    fileName = sanitizeFileName(file.name || parsed.data.title);
    mimeType = file.type || null;
    fileSizeBytes = file.size;
    const blob = await uploadEventFile(
      `documents/team/${session.eventId}/${team.id}/${Date.now()}-${fileName}`,
      file,
    );
    fileUrl = blob.url;
  }

  if (!fileUrl) {
    return NextResponse.json({ error: "A file or URL is required." }, { status: 400 });
  }

  const item = await prisma.teamLibraryItem.create({
    data: {
      eventId: session.eventId,
      teamId: team.id,
      createdById: session.userId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      fileUrl,
      fileName,
      fileType: parsed.data.fileType,
      mimeType,
      fileSizeBytes,
    },
    include: {
      team: { select: { id: true, countryCode: true, countryName: true } },
      createdBy: { select: { id: true, name: true, role: true } },
    },
  });

  return NextResponse.json(item, { status: 201 });
}
