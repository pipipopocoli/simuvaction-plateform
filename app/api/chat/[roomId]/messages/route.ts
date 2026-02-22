import { NextResponse, NextRequest } from "next/server";
import { getUserSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: { roomId: string } }
) {
    const session = await getUserSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, userId, role } = session;
    const { roomId } = params;

    try {
        // Basic verification: Is this room global, am I admin, or am I a member?
        const room = await prisma.chatRoom.findUnique({
            where: { id: roomId },
            include: {
                memberships: {
                    where: { userId }
                }
            }
        });

        if (!room || room.eventId !== eventId) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        if (role !== "admin" && room.roomType !== "global" && room.memberships.length === 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const messages = await prisma.chatMessage.findMany({
            where: { roomId },
            include: {
                sender: {
                    select: { id: true, name: true, role: true, avatarUrl: true, teamId: true }
                }
            },
            orderBy: { createdAt: "asc" }
        });

        // Update ChatRead
        await prisma.chatRead.upsert({
            where: {
                roomId_userId: { roomId, userId }
            },
            update: { lastReadAt: new Date() },
            create: { roomId, userId }
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error("GET ChatMessages error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: { roomId: string } }
) {
    const session = await getUserSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, userId, role } = session;
    const { roomId } = params;

    try {
        const { body, replyToId } = await req.json();

        if (!body || body.trim() === "") {
            return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
        }

        const room = await prisma.chatRoom.findUnique({
            where: { id: roomId },
            include: {
                memberships: {
                    where: { userId }
                }
            }
        });

        if (!room || room.eventId !== eventId) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        if (role !== "admin" && room.roomType !== "global" && room.memberships.length === 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const message = await prisma.chatMessage.create({
            data: {
                eventId,
                roomId,
                senderId: userId,
                body,
                replyToId: replyToId || null,
            },
            include: {
                sender: {
                    select: { id: true, name: true, role: true, avatarUrl: true, teamId: true }
                }
            }
        });

        return NextResponse.json(message);
    } catch (error) {
        console.error("POST ChatMessage error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
