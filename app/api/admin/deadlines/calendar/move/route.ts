import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import { isAdminLike } from "@/lib/authz";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session || !isAdminLike(session.role)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json().catch(() => null) as { id?: string; date?: string } | null;
    if (!body?.id || !body.date) {
      return NextResponse.json({ error: "Both `id` and `date` are required." }, { status: 400 });
    }

    const parsedDate = new Date(body.date);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date value." }, { status: 400 });
    }

    const existing = await prisma.eventDeadline.findUnique({ where: { id: body.id } });
    if (!existing || existing.eventId !== session.eventId) {
      return NextResponse.json({ error: "Deadline not found." }, { status: 404 });
    }

    const deadline = await prisma.eventDeadline.update({
      where: { id: body.id },
      data: { date: parsedDate },
      include: {
        createdBy: {
          select: { name: true, role: true },
        },
      },
    });

    return NextResponse.json(deadline);
  } catch (error) {
    console.error("Move Deadline Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
