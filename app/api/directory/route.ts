import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/server-auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getUserSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            where: { eventId: session.eventId },
            select: {
                id: true,
                name: true,
                role: true,
                teamId: true,
                team: {
                    select: {
                        countryName: true,
                    }
                }
            },
            orderBy: [
                { team: { countryName: "asc" } },
                { name: "asc" },
            ]
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("GET directory error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
