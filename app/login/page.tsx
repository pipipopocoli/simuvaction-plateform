import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getUserSession } from "@/lib/server-auth";

export default async function LoginPage() {
  const session = await getUserSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-[#FFFBF5]">
      <div className="w-full max-w-md rounded-none p-8 shadow-xl bg-white border border-[#E5E7EB]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 text-center">Simuvaction</p>
        <h1 className="mt-2 text-3xl font-bold text-[#111827] text-center uppercase tracking-wider font-serif">War Room</h1>
        <p className="mt-3 text-sm text-zinc-600 text-center">
          Connexion sécurisée à votre espace de travail.
        </p>

        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
