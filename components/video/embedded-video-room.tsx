"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: Record<string, unknown>,
    ) => {
      dispose?: () => void;
    };
  }
}

type VideoPayload = {
  roomName: string;
  displayName: string;
  role: string;
  canPublishAudio: boolean;
  canPublishVideo: boolean;
  googleMeetUrl: string | null;
  sessionType: "meeting" | "press";
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

function isVideoPayload(payload: unknown): payload is VideoPayload {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "roomName" in payload &&
      typeof payload.roomName === "string",
  );
}

function loadJitsiScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-jitsi-external-api="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Jitsi failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.dataset.jitsiExternalApi = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Jitsi failed to load."));
    document.body.appendChild(script);
  });
}

export function EmbeddedVideoRoom({
  kind,
  id,
}: {
  kind: "meeting" | "press";
  id: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<{ dispose?: () => void } | null>(null);
  const [payload, setPayload] = useState<VideoPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function mountConference() {
      try {
        const response = await fetch("/api/video/sessions/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, id }),
        });

        const nextPayload = (await response.json().catch(() => null)) as VideoPayload | { error?: string } | null;
        const responseError = getPayloadError(nextPayload);
        if (!response.ok || !nextPayload || responseError || !isVideoPayload(nextPayload)) {
          throw new Error(responseError || "Unable to open this video room.");
        }

        if (cancelled) {
          return;
        }
        setPayload(nextPayload);

        await loadJitsiScript();
        if (cancelled || !hostRef.current || !window.JitsiMeetExternalAPI) {
          return;
        }

        apiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
          roomName: nextPayload.roomName,
          parentNode: hostRef.current,
          width: "100%",
          height: "100%",
          userInfo: {
            displayName: nextPayload.displayName,
          },
          configOverwrite: {
            prejoinPageEnabled: true,
            startWithAudioMuted: !nextPayload.canPublishAudio,
            startWithVideoMuted: !nextPayload.canPublishVideo,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
            TOOLBAR_BUTTONS: nextPayload.canPublishAudio || nextPayload.canPublishVideo
              ? [
                  "microphone",
                  "camera",
                  "desktop",
                  "fullscreen",
                  "hangup",
                  "chat",
                  "raisehand",
                  "tileview",
                  "participants-pane",
                ]
              : ["fullscreen", "hangup", "chat", "tileview", "participants-pane"],
          },
        });
      } catch (mountError) {
        if (!cancelled) {
          setError(mountError instanceof Error ? mountError.message : "Unable to open this video room.");
        }
      }
    }

    mountConference();

    return () => {
      cancelled = true;
      apiRef.current?.dispose?.();
      apiRef.current = null;
    };
  }, [id, kind]);

  if (error) {
    return <p className="text-sm text-alert-red">{error}</p>;
  }

  return (
    <div className="space-y-4">
      {payload?.googleMeetUrl ? (
        <a
          href={payload.googleMeetUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-lg border border-ink-border bg-white px-3 py-2 text-sm font-semibold text-ink-blue hover:border-ink-blue/40"
        >
          Open Google Meet fallback
        </a>
      ) : null}
      <div ref={hostRef} className="h-[68vh] min-h-[480px] overflow-hidden rounded-2xl border border-ink-border bg-black" />
    </div>
  );
}
