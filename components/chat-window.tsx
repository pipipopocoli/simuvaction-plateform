"use client";

import { useEffect, useState, useRef } from "react";
import { Send } from "lucide-react";

type ChatMessage = {
    id: string;
    body: string;
    createdAt: string;
    sender: {
        id: string;
        name: string;
        role: string;
    };
};

export function ChatWindow({ roomId, currentUserId }: { roomId: string, currentUserId: string }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchMessages() {
            try {
                const res = await fetch(`/api/chat/${roomId}/messages`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                    // Scroll to bottom after loading
                    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                }
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchMessages();

        // Polling every 5 seconds for simulation
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [roomId]);

    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const body = newMessage;
        setNewMessage(""); // optimistic clear

        try {
            const res = await fetch(`/api/chat/${roomId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ body })
            });

            if (res.ok) {
                const msg = await res.json();
                setMessages(prev => [...prev, msg]);
                setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            }
        } catch (error) {
            console.error("Message send failed:", error);
        }
    }

    if (isLoading) {
        return (
            <div className="flex-1 bg-zinc-950 flex items-center justify-center rounded-r-lg border border-l-0 border-zinc-800">
                <div className="animate-pulse text-zinc-500">Connecting to secure comms...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-zinc-950 rounded-r-lg border border-l-0 border-zinc-800 h-[calc(100vh-80px)] relative">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur z-10 sticky top-0">
                <h2 className="text-zinc-100 font-semibold">Decrypted Channel</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.sender.id === currentUserId;
                    return (
                        <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}>
                            <span className="text-xs text-zinc-500 mb-1 ml-1 mr-1">
                                {isMe ? "You" : msg.sender.name} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className={`px-4 py-2 rounded-2xl ${isMe ? "bg-zinc-100 text-zinc-950 rounded-tr-sm" : "bg-zinc-800 text-zinc-100 rounded-tl-sm"}`}>
                                {msg.body}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            <div className="p-4 bg-zinc-950 border-t border-zinc-800">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type a secure message..."
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-4 text-zinc-100 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-zinc-100 text-zinc-950 p-2.5 rounded-full hover:bg-white disabled:opacity-50 disabled:bg-zinc-500 transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
