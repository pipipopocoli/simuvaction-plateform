import { getUserSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { DelegateWorkspaceClient } from "@/components/workspaces/delegate-workspace-client";

export default async function DelegateWorkspace() {
    const session = await getUserSession();
    if (!session || session.role !== "delegate") {
        redirect("/");
    }

    return (
        <div className="w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-serif font-bold tracking-tight text-ink mb-2">Bureau de la Délégation</h1>
                <p className="text-ink/60 text-sm">Préparez vos stratégies, négociez en direct et déposez vos suffrages.</p>
            </div>

            <DelegateWorkspaceClient userId={session.userId} role={session.role} />
        </div>
    );
}
