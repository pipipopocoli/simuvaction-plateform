import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/server-auth";

export default async function OverviewPage() {
    const session = await getUserSession();

    if (!session) {
        redirect("/login");
    }

    // Redirect users to their specific workspace
    if (session.role === "delegate") redirect("/workspace/delegate");
    if (session.role === "journalist") redirect("/workspace/journalist");
    if (session.role === "lobbyist") redirect("/workspace/lobbyist");
    if (session.role === "leader" || session.role === "admin") redirect("/workspace/leader");

    // Fallback
    return (
        <div className="flex h-[50vh] items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold">War Room</h1>
                <p className="text-zinc-500 mt-2">Invalid role detected.</p>
            </div>
        </div>
    );
}
