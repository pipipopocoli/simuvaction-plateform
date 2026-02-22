import { getUserSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";

export default async function LeaderWorkspace() {
    const session = await getUserSession();
    if (!session || (session.role !== "leader" && session.role !== "admin")) {
        redirect("/");
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Administration & Leadership</h1>
            <p className="text-zinc-600">Gérez les sondages (votes) et approuvez les articles de la Newsroom ici.</p>
            {/* Voting controls, News approval queue, God Mode Chat go here */}
        </div>
    );
}
