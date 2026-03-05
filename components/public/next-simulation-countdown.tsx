"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";

const PARIS_ZONE = "Europe/Paris";

type NextSimulationCountdownProps = {
  eventStartIsoParis: string;
  eventEndIsoParis: string;
  eventLabel: string;
};

type CountdownState = "before_start" | "in_progress" | "ended";

function resolveBrowserZone(): string {
  const candidate = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!candidate) return "UTC";
  return DateTime.now().setZone(candidate).isValid ? candidate : "UTC";
}

function toDurationParts(milliseconds: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

function toCountdownState(nowMs: number, startMs: number, endMs: number): CountdownState {
  if (nowMs < startMs) return "before_start";
  if (nowMs <= endMs) return "in_progress";
  return "ended";
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function NextSimulationCountdown({
  eventStartIsoParis,
  eventEndIsoParis,
  eventLabel,
}: NextSimulationCountdownProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const browserZone = useMemo(() => resolveBrowserZone(), []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const start = useMemo(
    () => DateTime.fromISO(eventStartIsoParis, { zone: PARIS_ZONE }).toUTC(),
    [eventStartIsoParis],
  );
  const end = useMemo(
    () => DateTime.fromISO(eventEndIsoParis, { zone: PARIS_ZONE }).toUTC(),
    [eventEndIsoParis],
  );

  if (!start.isValid || !end.isValid) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Countdown configuration error. Invalid event date.
      </div>
    );
  }

  const state = toCountdownState(nowMs, start.toMillis(), end.toMillis());
  const duration = toDurationParts(start.toMillis() - nowMs);
  const localStart = start.setZone(browserZone);

  return (
    <div className="rounded-2xl border border-[#cad7ef] bg-[#f7faff] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">Next Simulation Countdown</p>
      <h3 className="mt-2 font-serif text-2xl font-bold text-[#0f172a]">{eventLabel}</h3>
      <p className="mt-2 text-sm text-slate-700">March 25, 2026, 08:30 (Europe/Paris)</p>
      <p className="text-sm text-slate-700">
        Your local time: {localStart.toFormat("LLLL dd, yyyy, HH:mm")} ({browserZone})
      </p>

      {state === "before_start" ? (
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl border border-[#d7e2f6] bg-white px-2 py-3">
            <p className="text-2xl font-bold text-[#0f172a]">{pad(duration.days)}</p>
            <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Days</p>
          </div>
          <div className="rounded-xl border border-[#d7e2f6] bg-white px-2 py-3">
            <p className="text-2xl font-bold text-[#0f172a]">{pad(duration.hours)}</p>
            <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Hours</p>
          </div>
          <div className="rounded-xl border border-[#d7e2f6] bg-white px-2 py-3">
            <p className="text-2xl font-bold text-[#0f172a]">{pad(duration.minutes)}</p>
            <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Minutes</p>
          </div>
          <div className="rounded-xl border border-[#d7e2f6] bg-white px-2 py-3">
            <p className="text-2xl font-bold text-[#0f172a]">{pad(duration.seconds)}</p>
            <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Seconds</p>
          </div>
        </div>
      ) : null}

      {state === "in_progress" ? (
        <div className="mt-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          Simulation in progress
        </div>
      ) : null}

      {state === "ended" ? (
        <div className="mt-4 inline-flex rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
          Simulation ended
        </div>
      ) : null}

      <p className="mt-3 text-xs text-slate-500">Paris reference window: 08:30 to 18:00 (Europe/Paris)</p>
    </div>
  );
}
