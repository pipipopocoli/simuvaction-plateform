import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getUserSession } from "@/lib/server-auth";
import { BrandLogo } from "@/components/brand-logo";

export default async function LoginPage() {
  const session = await getUserSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f1e9] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#e2e6ee] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
        <div className="flex justify-center">
          <BrandLogo size="sm" priority />
        </div>
        <h1 className="mt-2 text-center font-serif text-3xl font-bold text-[#111827]">The Impact of Artificial Intelligence in Education</h1>
        <p className="mt-3 text-center text-sm text-zinc-600">Secure entry for delegates, journalists, lobbyists, and leaders.</p>

        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
