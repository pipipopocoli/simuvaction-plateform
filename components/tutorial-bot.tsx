"use client";

import { useState } from "react";
import { Bot, Sparkles, X } from "lucide-react";

export function TutorialBot({ role }: { role?: string }) {
    const [isOpen, setIsOpen] = useState(false);

    const getTutorialText = () => {
        switch (role) {
            case "delegate":
                return "Hi! I'm your SimuBot. As a Delegate, you can use the interactive map to check global stances, draft your position paper in the Workspace tab, and request bilateral meetings through the Secure Comms Center!";
            case "journalist":
                return "Hello! I'm SimuBot. Journalists use the Newsroom to draft articles. Remember to hit 'Submit for Review' so Leaders can publish your breaking news to the Front Page!";
            case "lobbyist":
                return "Hey there! Lobbyists have access to the Lobby Hub. You can monitor active votes in real-time and use the Secure Comms Center to influence delegations. Good luck!";
            case "leader":
                return "Welcome, Leader! Your dashboard helps you launch parliamentary votes and approve news items submitted by journalists. You control the flow of the simulation!";
            case "admin":
                return "Greetings, Professor! You have full God-Mode access. You can manage official deadlines, upload documents, and monitor every team's draft in real-time.";
            default:
                return "Welcome to SimuVaction: AI in Education! Explore the Atlas to see global stances, check the Newsroom for updates, and track Live Votes.";
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
            {/* The speech bubble */}
            {isOpen && (
                <div className="pointer-events-auto relative max-w-[280px] rounded-2xl rounded-br-none border border-ink-border bg-white p-4 shadow-xl animate-in fade-in slide-in-from-bottom-4">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute right-3 top-3 text-ink/40 hover:text-ink/80 transition"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <div className="pr-4">
                        <p className="font-serif text-[15px] font-bold text-ink mb-1">SimuBot says:</p>
                        <p className="text-sm text-ink/80 leading-relaxed">
                            {getTutorialText()}
                        </p>
                    </div>
                </div>
            )}

            {/* The bot button */}
            <div className="pointer-events-auto relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative flex h-14 w-14 items-center justify-center rounded-full bg-ink-blue text-white shadow-lg hover:bg-ink transition-all duration-300 group"
                >
                    <Bot className="h-7 w-7 group-hover:animate-bounce" />
                    <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-300 animate-pulse" />
                </button>
            </div>
        </div>
    );
}
