import { getUserSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";

export default async function LobbyistWorkspace() {
    const session = await getUserSession();
    if (!session || session.role !== "lobbyist") {
        redirect("/");
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Lobbyist Hub</h1>
            <p className="text-zinc-600">Access private channels to negotiate and influence delegations in real time.</p>
            {/* Target search and direct message lists go here */}
        </div>
    );
}
