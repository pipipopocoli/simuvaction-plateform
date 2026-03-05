"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const CONSENT_COOKIE_NAME = "simuvaction_consent";

function hasGrantedConsent(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((value) => value.trim())
    .some((entry) => entry === `${CONSENT_COOKIE_NAME}=granted`);
}

async function postEvent(payload: {
  eventType: string;
  pagePath: string;
  referrer?: string | null;
  dwellMs?: number;
}) {
  await fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
}

export function ConsentedAnalyticsEvents() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!hasGrantedConsent()) {
      return;
    }

    if (lastPathRef.current) {
      const dwellMs = Date.now() - startedAtRef.current;
      void postEvent({
        eventType: "page_leave",
        pagePath: lastPathRef.current,
        dwellMs,
        referrer: document.referrer || null,
      });
    }

    lastPathRef.current = pathname;
    startedAtRef.current = Date.now();

    void postEvent({
      eventType: "page_view",
      pagePath: pathname,
      referrer: document.referrer || null,
    });
  }, [pathname]);

  useEffect(() => {
    const onBeforeUnload = () => {
      if (!hasGrantedConsent() || !lastPathRef.current) {
        return;
      }

      const payload = JSON.stringify({
        eventType: "page_leave",
        pagePath: lastPathRef.current,
        dwellMs: Date.now() - startedAtRef.current,
        referrer: document.referrer || null,
      });

      navigator.sendBeacon?.("/api/analytics/event", payload);
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return null;
}
