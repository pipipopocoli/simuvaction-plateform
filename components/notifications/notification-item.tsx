"use client";

import Link from "next/link";
import { DateTime } from "luxon";

export type NotificationEntry = {
  id: string;
  type: string;
  title: string;
  body: string;
  deepLink: string | null;
  priority: string;
  createdAt: string;
  readAt: string | null;
};

type NotificationItemProps = {
  notification: NotificationEntry;
  onMarkRead: (notificationId: string) => void;
};

function toRelative(isoDate: string) {
  const date = DateTime.fromISO(isoDate);
  if (!date.isValid) {
    return "now";
  }
  return date.toRelative() ?? date.toUTC().toFormat("dd LLL HH:mm 'UTC'");
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const content = (
    <div className="rounded-lg border border-ink-border bg-[var(--color-surface)] p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">{notification.title}</p>
          <p className="mt-1 text-xs text-ink/70">{notification.body}</p>
        </div>
        {!notification.readAt ? (
          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-ink-blue" aria-hidden />
        ) : null}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.08em] text-ink/55">{toRelative(notification.createdAt)}</p>
        {!notification.readAt ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onMarkRead(notification.id);
            }}
            className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-blue hover:underline"
          >
            Mark read
          </button>
        ) : null}
      </div>
    </div>
  );

  if (!notification.deepLink) {
    return content;
  }

  return (
    <Link href={notification.deepLink} className="block">
      {content}
    </Link>
  );
}
