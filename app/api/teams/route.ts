import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getUserSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const teams = await prisma.team.findMany({
            where: { eventId: session.eventId },
            select: {
                id: true,
                countryName: true,
                countryCode: true,
            },
            orderBy: {
                countryName: "asc",
            }
        });

        return NextResponse.json(teams);
    } catch (error) {
        console.error("GET teams error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
