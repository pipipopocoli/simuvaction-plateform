import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";

// GET /api/admin/documents - Fetch all documents for the event
export async function GET() {
    try {
        const session = await getUserSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const documents = await prisma.eventDocument.findMany({
            where: { eventId: session.eventId },
            orderBy: { createdAt: "desc" },
            include: {
                createdBy: {
                    select: { name: true, role: true }
                }
            }
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error("Fetch Documents Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/admin/documents - Add a new shared resource/document link
export async function POST(req: NextRequest) {
    try {
        const session = await getUserSession();
        // Only allow Admin roles to attach official documents
        if (!session || session.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        const body = await req.json();
        const { title, description, url, type } = body;

        if (!title || !url) {
            return NextResponse.json({ error: "Title and a Valid URL link are required." }, { status: 400 });
        }

        const document = await prisma.eventDocument.create({
            data: {
                eventId: session.eventId,
                title,
                description,
                url,
                type: type || "pdf",
                createdById: session.userId,
            },
            include: {
                createdBy: {
                    select: { name: true }
                }
            }
        });

        return NextResponse.json(document, { status: 201 });
    } catch (error) {
        console.error("Create Document Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/admin/documents?id=xyz
export async function DELETE(req: NextRequest) {
    try {
        const session = await getUserSession();
        if (!session || session.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

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
