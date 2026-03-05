"use client";

import { useEffect, useState } from "react";

const CONSENT_COOKIE_NAME = "simuvaction_consent";

function readConsentCookie(): "granted" | "denied" | "unknown" {
  if (typeof document === "undefined") return "unknown";
  const cookie = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((entry) => entry.startsWith(`${CONSENT_COOKIE_NAME}=`));

  if (!cookie) return "unknown";
  const value = cookie.split("=")[1];
  if (value === "granted" || value === "denied") {
    return value;
  }
  return "unknown";
}

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<"granted" | "denied" | "unknown">("unknown");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setConsent(readConsentCookie());
  }, []);

  if (process.env.NEXT_PUBLIC_COOKIE_CONSENT_ENABLED !== "true") {
    return null;
  }

  if (consent !== "unknown") {
    return null;
  }

  async function submitConsent(status: "granted" | "denied") {
    setIsSubmitting(true);
    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          analyticsEnabled: status === "granted",
        }),
      });
      setConsent(status);
      window.dispatchEvent(new Event("simuvaction-consent-changed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-[70] rounded-xl border border-ink-border bg-white p-4 shadow-lg md:inset-x-6 md:max-w-3xl">
      <p className="text-sm font-semibold text-ink">Cookies & analytics consent</p>
      <p className="mt-1 text-xs text-ink/70">
        We use optional analytics cookies to understand which pages are useful and how long visitors stay.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => submitConsent("granted")}
          disabled={isSubmitting}
          className="rounded-md bg-ink-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
        >
          Accept analytics
        </button>
        <button
          type="button"
          onClick={() => submitConsent("denied")}
          disabled={isSubmitting}
          className="rounded-md border border-ink-border px-3 py-1.5 text-xs font-semibold text-ink/80 hover:bg-zinc-50 disabled:opacity-70"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
