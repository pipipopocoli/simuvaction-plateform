import { getUserSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";

export default async function JournalistWorkspace() {
    const session = await getUserSession();
    if (!session || session.role !== "journalist") {
        redirect("/");
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Newsroom - Salle de Rédaction</h1>
            <p className="text-zinc-600">Rédigez vos articles ici. Ils seront soumis à un Leader pour approbation avant d&apos;être diffusés mondialement.</p>
            {/* Tiptap Editor and Feed will go here */}
        </div>
    );
}
