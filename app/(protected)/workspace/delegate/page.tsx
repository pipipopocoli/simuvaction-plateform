import { getUserSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { DelegateWorkspaceClient } from "@/components/workspaces/delegate-workspace-client";
import { isAdminLike } from "@/lib/authz";

export default async function DelegateWorkspace() {
    const session = await getUserSession();
    if (!session || (session.role !== "delegate" && !isAdminLike(session.role))) {
        redirect("/");
    }

    return (
        <div className="w-full">
            <div className="mb-8">
                <h1 className="mb-2 text-3xl font-serif font-bold tracking-tight text-ink">Delegation Workspace</h1>
                <p className="text-sm text-ink/60">Prepare negotiation strategy, coordinate with allies, and cast delegation votes.</p>
            </div>

            <DelegateWorkspaceClient userId={session.userId} role={session.role} />
        </div>
    );
}
