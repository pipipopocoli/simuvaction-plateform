import { getUserSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { LeaderWorkspaceClient } from "@/components/workspaces/leader-workspace-client";

export default async function LeaderWorkspace() {
    const session = await getUserSession();
    if (!session || (session.role !== "leader" && session.role !== "admin")) {
        redirect("/");
    }

    return (
        <div className="w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-serif font-bold tracking-tight text-alert-red flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-alert-red animate-pulse" />
                    Haut Commandement
                </h1>
                <p className="text-ink/60 text-sm mt-2">Zone sécurisée. Vous avez les pleins pouvoirs analytiques et administratifs sur la simulation.</p>
            </div>

            <LeaderWorkspaceClient userId={session.userId} role={session.role} />
        </div>
    );
}
