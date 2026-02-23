import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/server-auth";
import { SetupPasswordForm } from "./setup-form";

export default async function SetupPasswordPage() {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.mustChangePassword) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f1e9] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#e2e6ee] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">SimuVaction</p>
        <h1 className="mt-2 text-center font-serif text-4xl font-bold text-[#111827]">Set Your Password</h1>
        <p className="mt-3 text-center text-sm text-zinc-600">
          Your account uses a temporary credential. Set a personal password before entering Commons.
        </p>

        <div className="mt-8">
          <SetupPasswordForm />
        </div>
      </div>
    </div>
  );
}
