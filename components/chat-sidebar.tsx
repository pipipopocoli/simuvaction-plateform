"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Hash, Target, Lock } from "lucide-react";

type ChatRoom = {
    id: string;
    name: string;
    roomType: string;
    _count?: { messages: number };
};

export function ChatSidebar({ currentRoomId }: { currentRoomId?: string }) {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchRooms() {
            try {
                const res = await fetch("/api/chat/rooms");
                if (res.ok) {
                    const data = await res.json();
                    setRooms(data);
                }
            } catch (error) {
                console.error("Failed to fetch rooms:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchRooms();
    }, []);

    return (
        <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-[calc(100vh-80px)] overflow-hidden rounded-l-lg">
            <div className="p-4 border-b border-zinc-800 font-semibold text-zinc-100 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-zinc-400" />
                Diplomatic Comms
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-6">
                {isLoading ? (
                    <div className="text-zinc-500 text-sm p-2 animate-pulse">Loading channels...</div>
                ) : (
                    <>
                        <div>
                            <div className="text-xs font-bold tracking-wider text-zinc-500 uppercase mb-2 px-2">Global Channels</div>
                            <div className="space-y-0.5">
                                {rooms.filter(r => r.roomType === "global").map(room => (
                                    <Link
                                        key={room.id}
                                        href={`/chat/${room.id}`}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition ${currentRoomId === room.id ? "bg-zinc-800 text-white font-medium" : ""}`}
                                    >
                                        <Hash className="w-4 h-4 text-zinc-500" />
                                        <span className="truncate">{room.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-bold tracking-wider text-zinc-500 uppercase mb-2 px-2">Private Comms</div>
                            <div className="space-y-0.5">
                                {rooms.filter(r => r.roomType === "private").map(room => (
                                    <Link
                                        key={room.id}
                                        href={`/workspace/chat/${room.id}`}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition ${currentRoomId === room.id ? "bg-zinc-800 text-white font-medium" : ""}`}
                                    >
                                        <Lock className="w-4 h-4 text-zinc-500" />
                                        <span className="truncate">{room.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-bold tracking-wider text-zinc-500 uppercase mb-2 px-2">Team Factions</div>
                            <div className="space-y-0.5">
                                {rooms.filter(r => r.roomType === "team").map(room => (
                                    <Link
                                        key={room.id}
                                        href={`/workspace/chat/${room.id}`}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition ${currentRoomId === room.id ? "bg-zinc-800 text-white font-medium" : ""}`}
                                    >
                                        <Target className="w-4 h-4 text-zinc-500" />
                                        <span className="truncate">{room.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
