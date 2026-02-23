import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/server-auth";
import { SetupPasswordForm } from "./setup-form";

export default async function SetupPasswordPage() {
    const session = await getUserSession();

    // If not logged in, redirect to login
    if (!session) {
        redirect("/login");
    }

    // If already changed password, redirect to workspace
    if (!session.mustChangePassword) {
        redirect("/");
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-6 bg-[#FFFBF5]">
            <div className="w-full max-w-md rounded-none p-8 shadow-xl bg-white border border-[#E5E7EB]">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 text-center">Simuvaction</p>
                <h1 className="mt-2 text-3xl font-bold text-[#111827] text-center uppercase tracking-wider font-serif">Account Setup</h1>
                <p className="mt-3 text-sm text-zinc-600 text-center">
                    For security reasons, you must change your initial password before accessing the War Room.
                </p>

                <div className="mt-8">
                    <SetupPasswordForm />
                </div>
            </div>
        </div>
    );
}
