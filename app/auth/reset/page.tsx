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

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: {
        gte: new Date(),
      },
    },
  });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f1e9] p-6">
        <div className="w-full max-w-md rounded-2xl border border-[#e2e6ee] bg-white p-8 text-center shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          <p className="font-medium text-red-600">Invalid or expired reset link.</p>
          <a href="/login" className="mt-4 inline-block text-sm text-zinc-600 underline hover:text-black">
            Return to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f1e9] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#e2e6ee] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">SimuVaction</p>
        <h1 className="mt-2 text-center font-serif text-4xl font-bold text-[#111827]">Reset Password</h1>
        <p className="mt-3 text-center text-sm text-zinc-600">Create a new password to recover your account access.</p>

        <div className="mt-8">
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}
