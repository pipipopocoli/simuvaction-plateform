import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ResetPasswordForm } from "./reset-form";

interface Props {
    searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage(props: Props) {
    const searchParams = await props.searchParams;
    const token = searchParams.token;

    if (!token) {
        redirect("/login");
    }

    // Look up user by valid, non-expired token
    const user = await prisma.user.findFirst({
        where: {
            resetToken: token,
            resetTokenExpiry: {
                gte: new Date(), // must be greater than or equal to now
            },
        },
    });

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6 bg-zinc-950">
                <div className="w-full max-w-md rounded-lg p-8 shadow-2xl bg-zinc-50 border border-zinc-200 text-center">
                    <p className="text-red-600 font-medium mb-4">Invalid or expired reset link.</p>
                    <a href="/login" className="text-zinc-600 hover:text-black underline text-sm">
                        Return to Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-6 bg-zinc-950">
            <div className="w-full max-w-md rounded-lg p-8 shadow-2xl bg-zinc-50 border border-zinc-200">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 text-center">Simuvaction</p>
                <h1 className="mt-2 text-3xl font-bold text-zinc-900 text-center uppercase tracking-wider">Reset Password</h1>
                <p className="mt-3 text-sm text-zinc-600 text-center">
                    Enter your new password below for account access.
                </p>

                <div className="mt-8">
                    {/* The form will submit the token securely to the API to authorize the change */}
                    <ResetPasswordForm token={token} />
                </div>
            </div>
        </div>
    );
}
