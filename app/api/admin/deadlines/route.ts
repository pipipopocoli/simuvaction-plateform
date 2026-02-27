import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";

// GET /api/admin/deadlines - Fetch all deadlines for the event
export async function GET(req: NextRequest) {
    try {
        const session = await getUserSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const deadlines = await prisma.eventDeadline.findMany({
            where: { eventId: session.eventId },
            orderBy: { date: "asc" },
            include: {
                createdBy: {
                    select: { name: true, role: true }
                }
            }
        });

        return NextResponse.json(deadlines);
    } catch (error) {
        console.error("Fetch Deadlines Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/admin/deadlines - Create a new deadline (Admin Only)
export async function POST(req: NextRequest) {
    try {
        const session = await getUserSession();
        // Only allow Admin/Leader roles to create events
        if (!session || (session.role !== "admin" && session.role !== "leader")) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        const body = await req.json();
        const { title, description, date } = body;

        if (!title || !date) {
            return NextResponse.json({ error: "Title and Date are required." }, { status: 400 });
        }

        const deadline = await prisma.eventDeadline.create({
            data: {
                eventId: session.eventId,
                title,
                description,
                date: new Date(date),
                createdById: session.userId,
            },
            include: {
                createdBy: {
                    select: { name: true }
                }
            }
        });

        return NextResponse.json(deadline, { status: 201 });
    } catch (error) {
        console.error("Create Deadline Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE is handled via a dynamic route or query param, let's implement query param for simplicity here:
// DELETE /api/admin/deadlines?id=xyz
export async function DELETE(req: NextRequest) {
    try {
        const session = await getUserSession();
        if (!session || (session.role !== "admin" && session.role !== "leader")) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Deadline ID is required" }, { status: 400 });
        }

        // Verify it belongs to the event before deleting
        const existing = await prisma.eventDeadline.findUnique({ where: { id } });
        if (!existing || existing.eventId !== session.eventId) {
            return NextResponse.json({ error: "Deadline not found." }, { status: 404 });
        }

        await prisma.eventDeadline.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Deadline Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
