import Link from "next/link";
import { getUserSession } from "@/lib/server-auth";

export default async function LandingPage() {
    const session = await getUserSession();

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col font-sans">
            <header className="w-full flex justify-between items-center p-6 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
                <div className="text-xl font-bold tracking-[0.2em] uppercase">SimuVaction</div>
                <nav className="flex items-center gap-4">
                    <Link href="/about" className="text-sm font-medium text-zinc-400 hover:text-white transition">About</Link>
                    <Link href="/program" className="text-sm font-medium text-zinc-400 hover:text-white transition">Program</Link>
                    {session ? (
                        <div className="flex items-center gap-4">
                            <Link
                                href={
                                    session.role === "delegate" ? "/workspace/delegate" :
                                        session.role === "journalist" ? "/workspace/journalist" :
                                            session.role === "lobbyist" ? "/workspace/lobbyist" : "/workspace/leader"
                                }
                                className="rounded bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
                            >
                                Go to Workspace
                            </Link>
                            <form action="/api/auth/logout" method="POST">
                                <button type="submit" className="text-zinc-400 hover:text-white transition p-2">
                                    Logout
                                </button>
                            </form>
                        </div>
                    ) : (
                        <Link href="/login" className="rounded border border-zinc-700 px-4 py-2 text-sm font-semibold transition hover:bg-zinc-800">
                            Agent Login
                        </Link>
                    )}
                </nav>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto">
                <div className="inline-block mb-4 px-3 py-1 rounded-full bg-zinc-900 text-xs font-mono tracking-wider text-zinc-400 border border-zinc-800 uppercase">
                    Edition 2026: Artificial Intelligence
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
                    The Diplomatic War Room
                </h1>
                <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed">
                    Welcome to the SimuVaction interactive platform. A real-time simulation environment for student delegates, journalists, and leaders.
                </p>

                {!session && (
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center rounded-lg bg-zinc-100 px-8 py-4 text-sm font-bold text-zinc-950 transition hover:bg-white hover:scale-105 active:scale-95"
                    >
                        Enter the Simulation
                    </Link>
                )}
            </main>

            <footer className="w-full text-center p-6 text-zinc-600 border-t border-zinc-900 text-sm">
                <p>© {new Date().getFullYear()} SimuVaction. All rights reserved.</p>
            </footer>
        </div>
    );
}
