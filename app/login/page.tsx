import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/server-auth";
import { LoginForm } from "@/components/login-form";
import Image from "next/image";
import Link from "next/link";

export default async function LoginPage() {
  const session = await getUserSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#511E84] via-[#3d1663] to-[#1a1a2e] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/">
            <Image
              src="/simuvaction-logo.png"
              alt="SimuVaction"
              width={180}
              height={45}
              className="mx-auto h-12 w-auto"
              priority
            />
          </Link>
          <p className="mt-3 text-sm text-white/60">
            Sign in to access the Commons
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
          <h1 className="mb-6 text-center text-xl font-bold text-[#1a1a2e]">
            Welcome back
          </h1>
          <LoginForm />
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-white/50 transition hover:text-white/80"
          >
            &larr; Back to Declaration
          </Link>
        </div>
      </div>
    </div>
  );
}
