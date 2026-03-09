"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Hash,
  Lock,
  MessageSquare,
  Plus,
  Target,
  Users,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/commons";

type ChatRoom = {
  id: string;
  name: string;
  roomType: string;
  recipientMode: string;
  topic: string | null;
  _count?: { messages: number; memberships: number };
};

type ContactsPayload = {
  members: Array<{
    id: string;
    name: string;
    role: string;
    teamId: string | null;
    teamName: string | null;
    preferredTimeZone: string;
  }>;
  teams: Array<{
    id: string;
    name: string;
    countryCode: string;
    memberCount: number;
    preferredTimeZone: string;
  }>;
};

function getPayloadError(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return null;
}

function isChatRoom(payload: unknown): payload is ChatRoom {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "id" in payload &&
      typeof payload.id === "string",
  );
}

export function ChatSidebar({ currentRoomId }: { currentRoomId?: string }) {
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contacts, setContacts] = useState<ContactsPayload>({ members: [], teams: [] });
  const [recipientMode, setRecipientMode] = useState<"direct" | "team" | "group">("direct");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [topic, setTopic] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function fetchRooms() {
    try {
      const response = await fetch("/api/chat/rooms");
      if (response.ok) {
        setRooms(await response.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchRooms();
  }, []);

  async function openNewChatModal() {
    setIsModalOpen(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/chat/contacts");
      if (res.ok) {
        setContacts(await res.json());
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function createRoom() {
    setCreateError(null);
    setIsCreating(true);

    const payload =
      recipientMode === "direct"
        ? {
            roomType: "direct",
            targetUserId: selectedMemberId,
            name: roomName || undefined,
            topic: topic || undefined,
          }
        : recipientMode === "team"
          ? {
              roomType: "team",
              targetTeamId: selectedTeamId,
              name: roomName || undefined,
              topic: topic || undefined,
            }
          : {
              roomType: "group",
              recipientMode: "group",
              participantIds: selectedMemberIds,
              name: roomName || "Private group",
              topic: topic || undefined,
            };

    try {
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const nextRoom = (await res.json().catch(() => null)) as ChatRoom | { error?: string } | null;
      const responseError = getPayloadError(nextRoom);
      if (!res.ok || !nextRoom || responseError || !isChatRoom(nextRoom)) {
        setCreateError(responseError || "Unable to create this room.");
        return;
      }

      setIsModalOpen(false);
      setRoomName("");
      setTopic("");
      setSelectedMemberId("");
      setSelectedMemberIds([]);
      setSelectedTeamId("");
      await fetchRooms();
      router.push(`/chat/${nextRoom.id}`);
    } finally {
      setIsCreating(false);
    }
  }

  const canCreate =
    (recipientMode === "direct" && Boolean(selectedMemberId)) ||
    (recipientMode === "team" && Boolean(selectedTeamId)) ||
    (recipientMode === "group" && selectedMemberIds.length > 0);

  const sections = useMemo(
    () => [
      { key: "global", label: "Global channel", icon: Hash },
      { key: "team", label: "Delegation rooms", icon: Target },
      { key: "group", label: "Private groups", icon: Users },
      { key: "direct", label: "Direct threads", icon: Lock },
    ],
    [],
  );

  return (
    <aside className="w-full max-w-[320px] rounded-l-xl border border-ink-border bg-white">
      <div className="flex items-center justify-between border-b border-ink-border px-4 py-3">
        <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-ink">
          <MessageSquare className="h-5 w-5 text-ink-blue" /> Messages
        </h2>
        <div className="flex items-center gap-2">
          <StatusBadge tone="live">PRIVATE</StatusBadge>
          <button
            type="button"
            onClick={openNewChatModal}
            className="rounded-md border border-ink-border p-2 text-ink hover:border-ink-blue/40"
            aria-label="Open new conversation"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
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
                  <div className="mb-2 flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/55">
                    <Icon className="h-3.5 w-3.5" />
                    {section.label}
                  </div>
                  <div className="space-y-1">
                    {items.map((room) => {
                      const active = room.id === currentRoomId;
                      return (
                        <Link
                          key={room.id}
                          href={`/chat/${room.id}`}
                          className={`block rounded-lg border px-3 py-2 text-sm transition ${
                            active
                              ? "border-ink-blue bg-blue-50 text-ink-blue"
                              : "border-transparent text-ink/75 hover:border-ink-border hover:bg-ivory"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-semibold">{room.name}</span>
                            <span className="text-xs text-ink/45">{room._count?.messages ?? 0}</span>
                          </div>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-ink/45">
                            {room.recipientMode} · {room._count?.memberships ?? 0} members
                          </p>
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

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-ink-border bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-2xl font-bold text-ink">Start a private conversation</h3>
                <p className="text-sm text-ink/60">Choose one member, a delegation, or a custom group.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-ink/40 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <button
                type="button"
                onClick={() => setRecipientMode("direct")}
                className={`rounded-xl border px-4 py-3 text-left ${
                  recipientMode === "direct" ? "border-ink-blue bg-blue-50" : "border-ink-border bg-white"
                }`}
              >
                <p className="font-semibold text-ink">Individual</p>
                <p className="mt-1 text-xs text-ink/60">One private thread with one member.</p>
              </button>
              <button
                type="button"
                onClick={() => setRecipientMode("team")}
                className={`rounded-xl border px-4 py-3 text-left ${
                  recipientMode === "team" ? "border-ink-blue bg-blue-50" : "border-ink-border bg-white"
                }`}
              >
                <p className="font-semibold text-ink">Delegation</p>
                <p className="mt-1 text-xs text-ink/60">Open a room with a full delegation roster.</p>
              </button>
              <button
                type="button"
                onClick={() => setRecipientMode("group")}
                className={`rounded-xl border px-4 py-3 text-left ${
                  recipientMode === "group" ? "border-ink-blue bg-blue-50" : "border-ink-border bg-white"
                }`}
              >
                <p className="font-semibold text-ink">Custom group</p>
                <p className="mt-1 text-xs text-ink/60">Select multiple members for a private room.</p>
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {recipientMode === "direct" ? (
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-ink">Member</span>
                  <select
                    value={selectedMemberId}
                    onChange={(event) => setSelectedMemberId(event.target.value)}
                    className="w-full rounded-lg border border-ink-border px-3 py-2 text-sm text-ink outline-none"
                  >
                    <option value="">Select a member</option>
                    {contacts.members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.teamName ?? member.role}) · {member.preferredTimeZone}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {recipientMode === "team" ? (
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-ink">Delegation</span>
                  <select
                    value={selectedTeamId}
                    onChange={(event) => setSelectedTeamId(event.target.value)}
                    className="w-full rounded-lg border border-ink-border px-3 py-2 text-sm text-ink outline-none"
                  >
                    <option value="">Select a delegation</option>
                    {contacts.teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} · {team.memberCount} members · {team.preferredTimeZone}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {recipientMode === "group" ? (
                <div>
                  <p className="mb-2 text-sm font-semibold text-ink">Members</p>
                  <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl border border-ink-border p-3">
                    {contacts.members.map((member) => {
                      const checked = selectedMemberIds.includes(member.id);
                      return (
                        <label key={member.id} className="flex items-center gap-3 rounded-lg border border-ink-border bg-ivory px-3 py-2 text-sm text-ink">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              setSelectedMemberIds((current) =>
                                event.target.checked
                                  ? [...current, member.id]
                                  : current.filter((id) => id !== member.id),
                              )
                            }
                          />
                          <span>
                            {member.name} ({member.teamName ?? member.role}) · {member.preferredTimeZone}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-ink">Conversation name</span>
                  <input
                    value={roomName}
                    onChange={(event) => setRoomName(event.target.value)}
                    placeholder={recipientMode === "group" ? "e.g. Drafting task force" : "Optional"}
                    className="w-full rounded-lg border border-ink-border px-3 py-2 text-sm text-ink outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-ink">Topic</span>
                  <input
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="Why this room exists"
                    className="w-full rounded-lg border border-ink-border px-3 py-2 text-sm text-ink outline-none"
                  />
                </label>
              </div>
            </div>

            {createError ? <p className="mt-4 text-sm font-semibold text-alert-red">{createError}</p> : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-ink-border bg-white px-4 py-2 text-sm font-semibold text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createRoom}
                disabled={!canCreate || isCreating}
                className="rounded-lg bg-ink-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isCreating ? "Creating..." : "Create private room"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
