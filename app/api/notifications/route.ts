import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 15), 1), 50);

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { eventId: session.eventId, userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({
      where: { eventId: session.eventId, userId: session.userId, readAt: null },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const notificationId =
    typeof payload?.notificationId === "string" && payload.notificationId.trim()
      ? payload.notificationId.trim()
      : null;
  const markAll = payload?.markAll === true;

  if (!notificationId && !markAll) {
    return NextResponse.json(
      { error: "Provide notificationId or markAll=true." },
      { status: 400 },
    );
  }

  if (markAll) {
    await prisma.notification.updateMany({
      where: { eventId: session.eventId, userId: session.userId, readAt: null },
      data: { readAt: new Date() },
    });
  } else if (notificationId) {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        eventId: session.eventId,
        userId: session.userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  const unreadCount = await prisma.notification.count({
    where: { eventId: session.eventId, userId: session.userId, readAt: null },
  });

  return NextResponse.json({ ok: true, unreadCount });
}
