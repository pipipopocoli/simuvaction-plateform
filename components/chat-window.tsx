"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { StatusBadge } from "@/components/ui/commons";

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

export function ChatWindow({ roomId, currentUserId }: { roomId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const response = await fetch(`/api/chat/${roomId}/messages`);
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as ChatMessage[];
        setMessages(data);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  async function handleSendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!newMessage.trim()) {
      return;
    }

    const body = newMessage;
    setNewMessage("");

    try {
      const response = await fetch(`/api/chat/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        return;
      }

      const message = (await response.json()) as ChatMessage;
      setMessages((prev) => [...prev, message]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch (error) {
      console.error("Message send failed:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-r-xl border border-l-0 border-ink-border bg-white">
        <p className="text-sm text-ink/55">Connecting to channel...</p>
      </div>
    );
  }

  return (
    <section className="flex h-[calc(100vh-190px)] flex-1 flex-col rounded-r-xl border border-l-0 border-ink-border bg-white">
      <header className="flex items-center justify-between border-b border-ink-border px-4 py-3">
        <h2 className="font-serif text-2xl font-bold text-ink">Channel</h2>
        <StatusBadge tone="live">Encrypted</StatusBadge>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => {
          const isMine = message.sender.id === currentUserId;
          return (
            <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${isMine ? "items-end" : "items-start"}`}>
                <p className="mb-1 text-xs text-ink/55">
                  {isMine ? "You" : message.sender.name} •{" "}
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <div
                  className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isMine
                      ? "rounded-tr-sm bg-ink-blue text-white"
                      : "rounded-tl-sm border border-ink-border bg-ivory text-ink"
                  }`}
                >
                  {message.body}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <footer className="border-t border-ink-border bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            placeholder="Type a message"
            className="flex-1 rounded-full border border-ink-border bg-ivory px-4 py-2 text-sm text-ink outline-none focus:border-ink-blue"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="grid h-10 w-10 place-items-center rounded-full bg-ink-blue text-white transition hover:bg-ink-blue/90 disabled:cursor-not-allowed disabled:bg-ink/35"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </footer>
    </section>
  );
}
