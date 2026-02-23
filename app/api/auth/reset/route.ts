import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            // For security, do not reveal if a user exists or not.
            return NextResponse.json({ success: true, message: "If an account matches, a reset link will be sent." });
        }

        // Generate a secure random token
        const token = crypto.randomBytes(32).toString("hex");
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 1); // 1 hour validity

        // Save token to database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: token,
                resetTokenExpiry: expiry,
            },
        });

        // TODO: Phase 6 - Connect SMTP (Resend/SendGrid) to actually email the link
        // For now, in MVP mode, we could log it securely to server console for testing
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/reset?token=${token}`;
        console.log(`[PASSWORD RESET GENERATED] Link for ${email}: ${resetUrl}`);

        return NextResponse.json({ success: true, message: "If an account matches, a reset link will be sent." });

    } catch (error) {
        console.error("Password reset error:", error);
        return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { token, password } = await req.json();

        if (!token || !password || password.length < 8) {
            return NextResponse.json({ error: "Invalid token or password." }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gte: new Date(),
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid or expired reset token." }, { status: 401 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password, clear the token and expiry date, and reset the MustChange password gate.
        await prisma.user.update({
            where: { id: user.id },
            data: {
                hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
                mustChangePassword: false,
            },
        });

        return NextResponse.json({ success: true, message: "Password updated successfully." });

    } catch (error) {
        console.error("Password PATCH error:", error);
        return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
    }
}
