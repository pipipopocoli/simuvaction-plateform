import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import { isAdminLike } from "@/lib/authz";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getUserSession();
    if (!session || !isAdminLike(session.role)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Deadline ID is required." }, { status: 400 });
    }

    const existing = await prisma.eventDeadline.findUnique({ where: { id } });
    if (!existing || existing.eventId !== session.eventId) {
      return NextResponse.json({ error: "Deadline not found." }, { status: 404 });
    }

    const body = await req.json().catch(() => null) as
      | {
          title?: string;
          description?: string | null;
          date?: string;
          isGlobal?: boolean;
        }
      | null;

    if (!body) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const updates: {
      title?: string;
      description?: string | null;
      date?: Date;
      isGlobal?: boolean;
    } = {};

    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (!title) {
        return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
      }
      updates.title = title;
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() || null;
    }

    if (body.date !== undefined) {
      const parsed = new Date(body.date);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid date value." }, { status: 400 });
      }
      updates.date = parsed;
    }

    if (body.isGlobal !== undefined) {
      updates.isGlobal = Boolean(body.isGlobal);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    const deadline = await prisma.eventDeadline.update({
      where: { id },
      data: updates,
      include: {
        createdBy: {
          select: { name: true, role: true },
        },
      },
    });

    return NextResponse.json(deadline);
  } catch (error) {
    console.error("Update Deadline Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
