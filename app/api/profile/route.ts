import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";

// PATCH /api/profile – update name, avatarUrl
export async function PATCH(req: NextRequest) {
    try {
        const session = await getUserSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { name, avatarUrl } = body;

        await prisma.user.update({
            where: { id: session.userId },
            data: {
                ...(name ? { name: String(name).trim() } : {}),
                ...(avatarUrl !== undefined ? { avatarUrl: String(avatarUrl) } : {}),
            },
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET /api/profile – get current user's profile
export async function GET(req: NextRequest) {
    try {
        const session = await getUserSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        });

        return NextResponse.json(user || {});
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
