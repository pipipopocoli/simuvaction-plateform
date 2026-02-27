import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/server-auth";
import { AdminWorkspaceClient } from "@/components/workspaces/admin-workspace-client";
import { isAdminLike } from "@/lib/authz";

export default async function AdminWorkspacePage() {
    const session = await getUserSession();

    if (!session) {
        redirect("/login");
    }

    // Double check authorization: only 'admin' role can enter directly here 
    if (!isAdminLike(session.role)) {
        redirect("/"); // Or redirect to their specific workspace
    }

    return (
        <div className="mx-auto max-w-7xl pt-4">
            <div className="mb-6">
                <h1 className="font-serif text-4xl font-bold text-ink">Professor / Admin Portal</h1>
                <p className="mt-2 text-ink/70">
                    Control center for course deadlines, syllabus documents, and simulation monitoring.
                </p>
            </div>

            <AdminWorkspaceClient userId={session.userId} />
        </div>
    );
}
