"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Hash, Lock, MessageSquare, Target } from "lucide-react";
import { StatusBadge } from "@/components/ui/commons";

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
        const response = await fetch("/api/chat/rooms");
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as ChatRoom[];
        setRooms(data);
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRooms();
  }, []);

  const sections = useMemo(
    () => [
      { key: "global", label: "Global channels", icon: Hash },
      { key: "team", label: "Team channels", icon: Target },
      { key: "private", label: "Private channels", icon: Lock },
    ],
    [],
  );

  return (
    <aside className="w-full max-w-[300px] rounded-l-xl border border-ink-border bg-white">
      <div className="flex items-center justify-between border-b border-ink-border px-4 py-3">
        <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-ink">
          <MessageSquare className="h-5 w-5 text-ink-blue" /> Messages
        </h2>
        <StatusBadge tone="live">LIVE</StatusBadge>
      </div>

      <div className="h-[calc(100vh-190px)] overflow-y-auto px-3 py-4">
        {isLoading ? (
          <p className="px-2 text-sm text-ink/55">Loading channels...</p>
        ) : (
          <div className="space-y-5">
            {sections.map((section) => {
              const items = rooms.filter((room) => room.roomType === section.key);
              if (items.length === 0) {
                return null;
              }

              const Icon = section.icon;
              return (
                <section key={section.key}>
                  <p className="mb-2 flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/55">
                    <Icon className="h-3.5 w-3.5" />
                    {section.label}
                  </p>
                  <div className="space-y-1">
                    {items.map((room) => {
                      const active = room.id === currentRoomId;
                      return (
                        <Link
                          key={room.id}
                          href={`/chat/${room.id}`}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                            active
                              ? "border border-ink-blue bg-blue-50 text-ink-blue"
                              : "border border-transparent text-ink/75 hover:border-ink-border hover:bg-ivory"
                          }`}
                        >
                          <span className="truncate">{room.name}</span>
                          <span className="text-xs text-ink/45">{room._count?.messages ?? 0}</span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
