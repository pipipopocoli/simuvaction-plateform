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

const createDocumentSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional(),
  url: z.string().trim().url().optional(),
  type: z.string().trim().min(1).max(40).default("file"),
  isPublic: z.boolean().default(true),
  targetTeamIds: z.array(z.string().min(1)).default([]),
});

async function parseDocumentRequest(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const url = String(formData.get("url") ?? "").trim();
    const type = String(formData.get("type") ?? "file").trim();
    const isPublic = String(formData.get("isPublic") ?? "true") !== "false";
    const targetTeamIds = formData.getAll("targetTeamIds").map((value) => String(value));
    const file = formData.get("file");

    return {
      parsed: createDocumentSchema.safeParse({
        title,
        description: description || undefined,
        url: url || undefined,
        type,
        isPublic,
        targetTeamIds,
      }),
      file: file instanceof File ? file : null,
    };
  }

  const json = await req.json().catch(() => null);
  return {
    parsed: createDocumentSchema.safeParse(json),
    file: null,
  };
}

export async function GET() {
  const session = await getUserSession();
  if (!session || !isAdminLike(session.role)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  try {
    const documents = await prisma.eventDocument.findMany({
      where: { eventId: session.eventId },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { name: true, role: true },
        },
        targetTeams: {
          select: { id: true, countryCode: true, countryName: true },
        },
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Fetch Documents Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session || !isAdminLike(session.role)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  try {
    const { parsed, file } = await parseDocumentRequest(req);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    let url = parsed.data.url ?? null;
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
        `documents/official/${session.eventId}/${Date.now()}-${fileName}`,
        file,
      );
      url = blob.url;
    }

    if (!url) {
      return NextResponse.json({ error: "A file or URL is required." }, { status: 400 });
    }

    const document = await prisma.eventDocument.create({
      data: {
        eventId: session.eventId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        url,
        type: parsed.data.type,
        fileName,
        mimeType,
        fileSizeBytes,
        isPublic: parsed.data.isPublic,
        createdById: session.userId,
        targetTeams:
          !parsed.data.isPublic && parsed.data.targetTeamIds.length > 0
            ? {
                connect: parsed.data.targetTeamIds.map((id) => ({ id })),
              }
            : undefined,
      },
      include: {
        createdBy: {
          select: { name: true, role: true },
        },
        targetTeams: {
          select: { id: true, countryCode: true, countryName: true },
        },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Create Document Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getUserSession();
  if (!session || !isAdminLike(session.role)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const existing = await prisma.eventDocument.findUnique({ where: { id } });
    if (!existing || existing.eventId !== session.eventId) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    await prisma.eventDocument.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Document Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
