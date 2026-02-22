import { getUserSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { VoteDashboard } from "@/components/voting/vote-dashboard";

export default async function DelegateWorkspace() {
    const session = await getUserSession();
    if (!session || session.role !== "delegate") {
        redirect("/");
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">Assemblée & Résolutions</h1>
                <p className="text-zinc-600">
                    Voici les résolutions actuellement soumises au vote. Assurez-vous de concerter votre délégation avant d'engager la voix de votre pays.
                </p>
                <VoteDashboard currentUserId={session.userId} currentUserRole={session.role} />
            </div>

            <div className="space-y-6">
                <h1 className="text-2xl font-bold">Fil d'Actualité</h1>
                <p className="text-zinc-600">Restez informé des derniers développements de l'Agence de Presse Officielle.</p>
                {/* News Feed will go here */}
            </div>
        </div>
    );
}
