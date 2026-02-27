import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/server-auth";

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
}

export async function POST(request: Request) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Avatar upload is not configured on this environment." },
      { status: 500 },
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 5MB)." }, { status: 400 });
  }

  const safeName = sanitizeFileName(file.name || "avatar");
  const path = `avatars/${session.eventId}/${session.userId}/${Date.now()}-${safeName}`;

  const blob = await put(path, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ ok: true, avatarUrl: blob.url });
}
