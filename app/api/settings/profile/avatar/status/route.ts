import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/server-auth";

const MAX_AVATAR_SIZE_MB = 5;

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    maxSizeMb: MAX_AVATAR_SIZE_MB,
  });
}
