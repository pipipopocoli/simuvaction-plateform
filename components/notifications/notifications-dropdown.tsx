"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { NotificationItem, type NotificationEntry } from "@/components/notifications/notification-item";

type NotificationsResponse = {
  notifications: NotificationEntry[];
  unreadCount: number;
};

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<NotificationEntry[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    const response = await fetch("/api/notifications?limit=12", { cache: "no-store" });
    if (!response.ok) {
      setIsLoading(false);
      return;
    }

    const payload = (await response.json()) as NotificationsResponse;
    setEntries(payload.notifications);
    setUnreadCount(payload.unreadCount);
    setIsLoading(false);
  }

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      void load();
    }, 0);
    const timer = setInterval(() => {
      void load();
    }, 10000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  async function markRead(notificationId: string) {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
    });
    if (!response.ok) return;

    const payload = (await response.json()) as { unreadCount: number };
    setUnreadCount(payload.unreadCount);
    setEntries((current) =>
      current.map((item) => (item.id === notificationId ? { ...item, readAt: new Date().toISOString() } : item)),
    );
  }

  async function markAllRead() {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    if (!response.ok) return;

    setUnreadCount(0);
    setEntries((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-lg border border-ink-border bg-white p-2 text-ink/70 transition hover:text-ink dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-alert-red px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[360px] max-w-[90vw] rounded-xl border border-ink-border bg-[var(--color-surface)] p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-ink/65">Notifications</p>
            <button
              type="button"
              onClick={markAllRead}
              className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-blue hover:underline"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {isLoading ? <p className="text-sm text-ink/60">Loading...</p> : null}
            {!isLoading && entries.length === 0 ? (
              <p className="text-sm text-ink/60">No notifications yet.</p>
            ) : null}
            {!isLoading
              ? entries.map((entry) => (
                  <NotificationItem key={entry.id} notification={entry} onMarkRead={markRead} />
                ))
              : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
