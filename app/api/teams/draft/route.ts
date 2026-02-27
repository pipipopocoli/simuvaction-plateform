import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";

// GET /api/teams/draft - Fetch the team's current declaration draft
export async function GET(req: NextRequest) {
    try {
        const session = await getUserSession();
        if (!session || !session.teamId) {
            return NextResponse.json({ error: "Unauthorized or no team" }, { status: 401 });
        }

        const team = await prisma.team.findUnique({
            where: { id: session.teamId },
            select: { declarationDraft: true }
        });

        return NextResponse.json({ draft: team?.declarationDraft || "" });
    } catch (error) {
        console.error("Fetch Draft Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/teams/draft - Save the team's declaration draft
export async function PATCH(req: NextRequest) {
    try {
        const session = await getUserSession();
        // Delegates and Leaders belonging to a team can save the draft.
        if (!session || !session.teamId) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        const body = await req.json();
        const { draft } = body;

        if (typeof draft !== "string") {
            return NextResponse.json({ error: "Invalid content format." }, { status: 400 });
        }

        await prisma.team.update({
            where: { id: session.teamId },
            data: { declarationDraft: draft }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Save Draft Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
