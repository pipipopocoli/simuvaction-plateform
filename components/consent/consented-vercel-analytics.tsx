"use client";

import { useSyncExternalStore } from "react";
import { Analytics } from "@vercel/analytics/next";

const CONSENT_COOKIE_NAME = "simuvaction_consent";

function hasGrantedConsent(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((value) => value.trim())
    .some((entry) => entry === `${CONSENT_COOKIE_NAME}=granted`);
}

export function ConsentedVercelAnalytics() {
  const isVercelRuntime = Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV);
  const enabled = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => undefined;
      }
      window.addEventListener("simuvaction-consent-changed", onStoreChange);
      window.addEventListener("focus", onStoreChange);
      return () => {
        window.removeEventListener("simuvaction-consent-changed", onStoreChange);
        window.removeEventListener("focus", onStoreChange);
      };
    },
    () => hasGrantedConsent(),
    () => false,
  );

  if (!isVercelRuntime) {
    return null;
  }

  if (process.env.NEXT_PUBLIC_COOKIE_CONSENT_ENABLED !== "true") {
    return <Analytics />;
  }

  return enabled ? <Analytics /> : null;
}
