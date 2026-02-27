import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getUserSession();
        // Only Admin (Game Master) can read all teams' drafts
        if (!session || session.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        const teams = await prisma.team.findMany({
            where: { eventId: session.eventId },
            select: {
                id: true,
                countryName: true,
                countryCode: true,
                declarationDraft: true,
                updatedAt: true
            },
            orderBy: { countryName: "asc" }
        });

        return NextResponse.json(teams);
    } catch (error) {
        console.error("Fetch All Drafts Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
