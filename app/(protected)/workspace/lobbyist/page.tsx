import { getUserSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { LobbyistWorkspaceClient } from "@/components/workspaces/lobbyist-workspace-client";

export default async function LobbyistWorkspace() {
    const session = await getUserSession();
    if (!session || (session.role !== "lobbyist" && session.role !== "admin")) {
        redirect("/");
    }

    return (
        <div className="w-full h-full min-h-[calc(100vh-64px)] bg-ivory">
            <LobbyistWorkspaceClient userId={session.userId} role={session.role} />
        </div>
    );
}
