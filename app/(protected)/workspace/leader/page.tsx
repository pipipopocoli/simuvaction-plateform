import { getUserSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { LeaderWorkspaceClient } from "@/components/workspaces/leader-workspace-client";
import { isAdminLike } from "@/lib/authz";

export default async function LeaderWorkspace() {
    const session = await getUserSession();
    if (!session || (session.role !== "leader" && !isAdminLike(session.role))) {
        redirect("/");
    }

    return (
        <div className="w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-serif font-bold tracking-tight text-alert-red flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-alert-red animate-pulse" />
                    Leadership Command
                </h1>
                <p className="mt-2 text-sm text-ink/60">Secured area with full analytical and administrative authority for the simulation.</p>
            </div>

            <LeaderWorkspaceClient userId={session.userId} role={session.role} />
        </div>
    );
}
