import { getUserSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { AdminVotePanel } from "@/components/voting/admin-vote-panel";

export default async function LeaderWorkspace() {
    const session = await getUserSession();
    if (!session || (session.role !== "leader" && session.role !== "admin")) {
        redirect("/");
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">Administration & Leadership</h1>
                <p className="text-zinc-600">Gérez les résolutions de vote et approuvez les articles de la Newsroom.</p>

                <AdminVotePanel />
            </div>

            <div className="space-y-6">
                <h1 className="text-2xl font-bold">Tableau de Bord</h1>
                <p className="text-zinc-600">Approbations d'articles en attente de votre sceau majeur :</p>
                {/* News Approval Queue will go here */}
            </div>
        </div>
    );
}
