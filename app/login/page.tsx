import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getUserSession } from "@/lib/server-auth";

export default async function LoginPage() {
  const session = await getUserSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f1e9] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#e2e6ee] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">SimuVaction 2024</p>
        <h1 className="mt-2 text-center font-serif text-3xl font-bold text-[#111827]">The Impact of Artificial Intelligence in Education</h1>
        <p className="mt-3 text-center text-sm text-zinc-600">Secure entry for delegates, journalists, lobbyists, and leaders.</p>

        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
