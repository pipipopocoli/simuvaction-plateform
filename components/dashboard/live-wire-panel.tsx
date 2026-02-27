"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe2 } from "lucide-react";
import { Panel, StatusBadge } from "@/components/ui/commons";

type LiveWireItem = {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
};

export function LiveWirePanel() {
  const [items, setItems] = useState<LiveWireItem[]>([]);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/news/live-wire", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { items: LiveWireItem[] };
      setItems(payload.items.slice(0, 5));
    }

    load();
    const timer = setInterval(load, 120000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-ink">
          <Globe2 className="h-5 w-5 text-ink-blue" /> Live Wire
        </h2>
        <StatusBadge tone="live">Reuters/AP</StatusBadge>
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink/65">No external headline currently available.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <Link
              key={`${item.source}:${item.url}`}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-ink-border bg-white px-3 py-2 hover:border-ink-blue"
            >
              <p className="text-xs uppercase tracking-[0.08em] text-ink/55">
                {item.source} • {new Date(item.publishedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">{item.title}</p>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}
