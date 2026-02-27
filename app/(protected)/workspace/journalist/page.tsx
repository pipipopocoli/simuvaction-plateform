import { getUserSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { JournalistWorkspaceClient } from "@/components/workspaces/journalist-workspace-client";
import { isAdminLike } from "@/lib/authz";

export default async function JournalistWorkspace() {
    const session = await getUserSession();
    if (!session || (session.role !== "journalist" && !isAdminLike(session.role))) {
        redirect("/");
    }

    return (
        <div className="w-full h-full min-h-[calc(100vh-64px)] bg-ivory">
            <JournalistWorkspaceClient payload={session} />
        </div>
    );
}
