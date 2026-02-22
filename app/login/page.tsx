import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getUserSession } from "@/lib/server-auth";

export default async function LoginPage() {
  const session = await getUserSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-zinc-950">
      <div className="w-full max-w-md rounded-lg p-8 shadow-2xl bg-zinc-50 border border-zinc-200">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 text-center">Simuvaction</p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900 text-center uppercase tracking-wider">War Room</h1>
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
