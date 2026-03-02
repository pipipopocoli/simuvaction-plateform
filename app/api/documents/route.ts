import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const createDocumentSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    url: z.string().url("Must be a valid URL"),
    type: z.string().default("pdf"),
    isPublic: z.boolean().default(true),
    targetTeamIds: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session?.eventId || !session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { role: true, teamId: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isAdmin = user.role === "admin" || user.role === "operator";

        const documents = await prisma.eventDocument.findMany({
            where: {
                eventId: session.eventId,
                OR: [
                    { isPublic: true },
                    isAdmin ? {} : { targetTeams: { some: { id: user.teamId || "" } } },
                ],
            },
            include: {
                createdBy: {
                    select: { name: true, displayRole: true }
                },
                targetTeams: {
                    select: { id: true, countryCode: true, countryName: true }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error("Failed to fetch documents:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session?.eventId || !session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Optional: restrict to admin/leaders
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { role: true },
        });

        if (user?.role !== "admin" && user?.role !== "operator") {
            return NextResponse.json({ error: "Forbidden: Only admins can upload official documents" }, { status: 403 });
        }

        const json = await request.json();
        const result = createDocumentSchema.safeParse(json);

        if (!result.success) {
            return NextResponse.json({ error: "Invalid payload", details: result.error.errors }, { status: 400 });
        }

        const data = result.data;

        const document = await prisma.eventDocument.create({
            data: {
                eventId: session.eventId,
                createdById: session.userId,
                title: data.title,
                description: data.description,
                url: data.url,
                type: data.type,
                isPublic: data.isPublic,
                targetTeams: !data.isPublic && data.targetTeamIds && data.targetTeamIds.length > 0
                    ? { connect: data.targetTeamIds.map(id => ({ id })) }
                    : undefined,
            },
            include: {
                targetTeams: {
                    select: { id: true, countryCode: true }
                }
            }
        });

        return NextResponse.json(document);
    } catch (error) {
        console.error("Failed to create document:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
