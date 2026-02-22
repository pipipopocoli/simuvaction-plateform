import { getUserSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";

export default async function DelegateWorkspace() {
    const session = await getUserSession();
    if (!session || session.role !== "delegate") {
        redirect("/");
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Delegate Workspace</h1>
            <p className="text-zinc-600">Bienvenue dans la salle de crise. Préparez vos résolutions et communiquez avec vos alliés.</p>
            {/* Map, Voting Alerts, and Chat will go here */}
        </div>
    );
}
