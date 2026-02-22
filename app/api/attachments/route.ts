import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { storageProvider } from "@/lib/storage/provider";

const createAttachmentSchema = z
  .object({
    taskId: z.string().optional(),
    libraryItemId: z.string().optional(),
    title: z.string().min(1),
    url: z.string().url(),
  })
  .refine((value) => Boolean(value.taskId) || Boolean(value.libraryItemId), {
    message: "Either taskId or libraryItemId is required.",
  });

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createAttachmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const link = await storageProvider.createAttachmentLink({
    title: parsed.data.title,
    url: parsed.data.url,
  });

  const attachment = await prisma.attachmentLink.create({
    data: {
      taskId: parsed.data.taskId,
      libraryItemId: parsed.data.libraryItemId,
      title: link.title,
      url: link.url,
    },
  });

  return NextResponse.json({ attachment });
}
