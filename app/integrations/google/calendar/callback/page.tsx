"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function GoogleCalendarCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [message, setMessage] = useState(
    code ? "Connecting Google Calendar..." : "Missing Google authorization code.",
  );

  useEffect(() => {
    if (!code) {
      return;
    }

    fetch("/api/integrations/google/calendar/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Unable to connect Google Calendar.");
        }
        setMessage("Google Calendar connected. Redirecting to settings...");
        setTimeout(() => router.replace("/settings"), 1000);
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "Unable to connect Google Calendar.");
      });
  }, [code, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f2e8] px-6">
      <div className="w-full max-w-lg rounded-2xl border border-ink-border bg-white p-8 text-center shadow-sm">
        <h1 className="font-serif text-3xl font-bold text-ink">Google Calendar</h1>
        <p className="mt-3 text-sm text-ink/70">{message}</p>
      </div>
    </div>
  );
}

export default function GoogleCalendarCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f6f2e8] px-6">
          <div className="w-full max-w-lg rounded-2xl border border-ink-border bg-white p-8 text-center shadow-sm">
            <h1 className="font-serif text-3xl font-bold text-ink">Google Calendar</h1>
            <p className="mt-3 text-sm text-ink/70">Connecting Google Calendar...</p>
          </div>
        </div>
      }
    >
      <GoogleCalendarCallbackContent />
    </Suspense>
  );
}
