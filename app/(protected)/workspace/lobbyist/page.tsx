import { getUserSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { LobbyistWorkspaceClient } from "@/components/workspaces/lobbyist-workspace-client";
import { isAdminLike } from "@/lib/authz";

export default async function LobbyistWorkspace() {
    const session = await getUserSession();
    if (!session || (session.role !== "lobbyist" && !isAdminLike(session.role))) {
        redirect("/");
    }

    return (
        <div className="w-full h-full min-h-[calc(100vh-64px)] bg-ivory">
            <LobbyistWorkspaceClient userId={session.userId} role={session.role} />
        </div>
    );
}
