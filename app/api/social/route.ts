import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import { z } from "zod";

const postSchema = z.object({
    body: z.string().min(1, "Post cannot be empty").max(280, "Post is too long"),
});

export async function GET(request: Request) {
    try {
        const session = await getUserSession();
        if (!session?.eventId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        const posts = await prisma.socialPost.findMany({
            where: { eventId: session.eventId },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        displayRole: true,
                        avatarUrl: true,
                    }
                },
                team: {
                    select: {
                        id: true,
                        countryName: true,
                        countryCode: true,
                    }
                }
            }
        });

        return NextResponse.json(posts);
    } catch (error) {
        console.error("Failed to fetch social posts:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getUserSession();
        if (!session?.eventId || !session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const json = await request.json();
        const result = postSchema.safeParse(json);

        if (!result.success) {
            return NextResponse.json({ error: "Invalid payload", details: result.error.issues }, { status: 400 });
        }

        // Must fetch author team
        const author = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { teamId: true },
        });

        const post = await prisma.socialPost.create({
            data: {
                eventId: session.eventId,
                authorId: session.userId,
                teamId: author?.teamId ?? null,
                body: result.data.body,
            },
            include: {
                author: {
                    select: { id: true, name: true, displayRole: true, avatarUrl: true },
                },
                team: {
                    select: { id: true, countryName: true, countryCode: true },
                },
            }
        });

        return NextResponse.json(post);
    } catch (error) {
        console.error("Failed to extract social post:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
