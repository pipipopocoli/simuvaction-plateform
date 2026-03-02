import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import { isAdminLike } from "@/lib/authz";

export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session || !isAdminLike(session.role)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const fromRaw = searchParams.get("from");
    const toRaw = searchParams.get("to");

    const from = fromRaw ? new Date(fromRaw) : null;
    const to = toRaw ? new Date(toRaw) : null;

    if (from && Number.isNaN(from.getTime())) {
      return NextResponse.json({ error: "Invalid `from` date." }, { status: 400 });
    }

    if (to && Number.isNaN(to.getTime())) {
      return NextResponse.json({ error: "Invalid `to` date." }, { status: 400 });
    }

    const deadlines = await prisma.eventDeadline.findMany({
      where: {
        eventId: session.eventId,
        date: {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {}),
        },
      },
      orderBy: { date: "asc" },
      include: {
        createdBy: {
          select: { name: true, role: true },
        },
      },
    });

    return NextResponse.json({ deadlines });
  } catch (error) {
    console.error("Calendar Deadlines Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
