"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Hash, Lock, MessageSquare, Target, Plus, X } from "lucide-react";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teams, setTeams] = useState<{ id: string, countryName: string }[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/chat/rooms");
      if (response.ok) setRooms(await response.json());
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const openNewChatModal = async () => {
    setIsModalOpen(true);
    try {
      const res = await fetch("/api/teams");
      if (res.ok) setTeams(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const createRoom = async () => {
    if (!roomName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roomName,
          roomType: "private",
          targetTeamId: selectedTeamId || undefined,
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setRoomName("");
        setSelectedTeamId("");
        fetchRooms();
      }
    } finally {
      setIsCreating(false);
    }
  };

  const sections = useMemo(
    () => [
      { key: "global", label: "Global channels", icon: Hash },
      { key: "team", label: "Team channels", icon: Target },
      { key: "direct", label: "Direct channels", icon: MessageSquare },
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
                  <div className="mb-2 flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/55">
                    <p className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" />
                      {section.label}
                    </p>
                    {section.key === "private" && (
                      <button onClick={openNewChatModal} className="text-ink-blue hover:text-ink-blue-hover transition p-1 hover:bg-blue-50 rounded">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {items.map((room) => {
                      const active = room.id === currentRoomId;
                      return (
                        <Link
                          key={room.id}
                          href={`/chat/${room.id}`}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${active
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-ink-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl font-bold text-ink">New Bilateral Meeting</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-ink/40 hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ink/60 mb-1.5">Channel Name</label>
                <input
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder="e.g. France-Canada Bilateral"
                  className="w-full rounded-lg border border-ink-border px-3 py-2 text-sm outline-none focus:border-ink-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ink/60 mb-1.5">Target Delegation (Optional)</label>
                <select
                  value={selectedTeamId}
                  onChange={e => setSelectedTeamId(e.target.value)}
                  className="w-full rounded-lg border border-ink-border px-3 py-2 text-sm outline-none focus:border-ink-blue"
                >
                  <option value="">-- None / Custom Group --</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.countryName}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={createRoom}
              disabled={isCreating || !roomName.trim()}
              className="w-full rounded-lg bg-ink-blue py-2 text-sm font-bold text-white hover:bg-ink-blue-hover transition disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Establish Secure Channel"}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
