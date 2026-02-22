import { NextResponse, NextRequest } from "next/server";
import { getUserSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await getUserSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, userId, role } = session;

    try {
        // A user can read rooms that are:
        // 1. global room for the event
        // 2. rooms where they have explicit chat_memberships
        // 3. ANY room if they are admin

        let rooms;

        if (role === "admin") {
            rooms = await prisma.chatRoom.findMany({
                where: { eventId },
                include: { _count: { select: { messages: true } } },
                orderBy: { createdAt: "asc" }
            });
        } else {
            rooms = await prisma.chatRoom.findMany({
                where: {
                    eventId,
                    OR: [
                        { roomType: "global" },
                        { memberships: { some: { userId } } }
                    ]
                },
                include: { _count: { select: { messages: true } } },
                orderBy: { createdAt: "asc" }
            });
        }

        // Also get unread counts: count messages created after the user's last `ChatRead`.
        // Complex logic is simplified by returning the rooms and we handle unreads on the client 
        // or by doing a dedicated unread query, doing it here might be heavy. For now, returning basic rooms.

        return NextResponse.json(rooms);
    } catch (error) {
        console.error("GET ChatRooms error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getUserSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, userId } = session;

    try {
        const { name, roomType, teamId, participantIds } = await req.json();

        if (!name || !roomType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const room = await prisma.chatRoom.create({
            data: {
                eventId,
                name,
                roomType,
                teamId: teamId || null,
                createdById: userId,
                memberships: {
                    create: [
                        { userId, role: "owner" },
                        // Assuming participantIds is an array of other user UUIDs
                        ...(participantIds || []).map((id: string) => ({ userId: id, role: "member" }))
                    ]
                }
            },
        });

        return NextResponse.json(room);
    } catch (error) {
        console.error("POST ChatRoom error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
