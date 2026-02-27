import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";

export async function GET() {
    try {
        const session = await getUserSession();
        if (!session || !session.teamId) {
            return NextResponse.json({ error: "Unauthorized or no team" }, { status: 401 });
        }

        const team = await prisma.team.findUnique({
            where: { id: session.teamId },
            select: { stanceShort: true, stanceLong: true, priorities: true }
        });

        return NextResponse.json(team || {});
    } catch (error) {
        console.error("Fetch Profile Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getUserSession();
        if (!session || !session.teamId) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        const body = await req.json();
        const { stanceShort, stanceLong } = body;

        await prisma.team.update({
            where: { id: session.teamId },
            data: {
                stanceShort: stanceShort !== undefined ? String(stanceShort).substring(0, 140) : undefined,
                stanceLong: stanceLong !== undefined ? String(stanceLong) : undefined
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Save Profile Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
