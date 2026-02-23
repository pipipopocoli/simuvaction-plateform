import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getUserSession, encrypt } from "@/lib/server-auth";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const session = await getUserSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { password } = await req.json();

        if (!password || password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters long." },
                { status: 400 }
            );
        }

        // Hash the new password properly
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the database user record
        await prisma.user.update({
            where: { id: session.userId },
            data: {
                hashedPassword,
                mustChangePassword: false, // Flag off!
            },
        });

        // We must refresh the session payload so `mustChangePassword` is removed
        // Otherwise the middleware will still redirect them back to setup based on the old JWT
        const updatedPayload = {
            ...session,
            mustChangePassword: false,
        };

        const sessionToken = await encrypt(updatedPayload);

        (await cookies()).set("session", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24, // 24 hours
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Setup error:", error);
        return NextResponse.json(
            { error: "An internal server error occurred." },
            { status: 500 }
        );
    }
}
