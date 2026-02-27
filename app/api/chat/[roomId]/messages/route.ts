import { NextResponse, NextRequest } from "next/server";
import { getUserSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { isAdminLike } from "@/lib/authz";

function truncateBody(value: string, limit = 110) {
    const text = value.trim();
    if (text.length <= limit) {
        return text;
    }
    return `${text.slice(0, limit - 1)}…`;
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const session = await getUserSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, userId, role } = session;
    const { roomId } = await params;

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

        if (!isAdminLike(role) && room.roomType !== "global" && room.memberships.length === 0) {
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
    { params }: { params: Promise<{ roomId: string }> }
) {
    const session = await getUserSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, userId, role } = session;
    const { roomId } = await params;

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

        if (!isAdminLike(role) && room.roomType !== "global" && room.memberships.length === 0) {
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

        let recipientIds: string[] = [];

        if (room.roomType === "global") {
            const users = await prisma.user.findMany({
                where: { eventId, id: { not: userId } },
                select: { id: true },
            });
            recipientIds = users.map((user) => user.id);
        } else {
            const members = await prisma.chatMembership.findMany({
                where: { roomId, userId: { not: userId } },
                select: { userId: true },
            });
            recipientIds = members.map((member) => member.userId);
        }

        if (recipientIds.length > 0) {
            await prisma.notification.createMany({
                data: recipientIds.map((recipientId) => ({
                    eventId,
                    userId: recipientId,
                    type: "chat_message",
                    title: `New message in ${room.name}`,
                    body: `${message.sender.name}: ${truncateBody(message.body)}`,
                    deepLink: `/chat/${roomId}`,
                    priority: "normal",
                })),
            });
        }

        return NextResponse.json(message);
    } catch (error) {
        console.error("POST ChatMessage error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
