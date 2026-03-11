"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { ArrowRight, CalendarClock, Loader2, MessageSquare, Mic2, Users, X } from "lucide-react";
import type { AtlasDelegation, AtlasMapPoint } from "@/lib/atlas";
import { toSvgCountryIso2 } from "@/lib/atlas";
import { isAdminLike } from "@/lib/authz";
import { ClickableWorldMap } from "@/components/atlas/clickable-world-map";
import { MeetingRequestDialog, type MeetingRequestPreset } from "@/components/meetings/meeting-request-form";

type MapVoteSignal = {
  id: string;
  title: string;
  ballotCount: number;
};

type MapUpcomingSignal = {
  id: string;
  title: string;
  startsAtIso: string;
};

type InteractiveGlobalMapProps = {
  delegations: AtlasDelegation[];
  selectedDelegationId: string | null;
  onSelectDelegation: (delegationId: string | null) => void;
  activeVotes: MapVoteSignal[];
  upcomingEvents: MapUpcomingSignal[];
  sessionRole: string;
  onOpenUpcomingEvent?: (eventId: string) => void;
};

type MapMetrics = {
  width: number;
  height: number;
  renderedWidth: number;
  renderedHeight: number;
  offsetX: number;
  offsetY: number;
};

type CountryCentersByIso = Record<string, AtlasMapPoint>;

const WORLD_ASPECT_RATIO = 1010 / 666;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toMapMetrics(width: number, height: number): MapMetrics | null {
  if (width <= 0 || height <= 0) {
    return null;
  }

  const ratio = width / height;
  if (ratio > WORLD_ASPECT_RATIO) {
    const renderedWidth = height * WORLD_ASPECT_RATIO;
    return {
      width,
      height,
      renderedWidth,
      renderedHeight: height,
      offsetX: (width - renderedWidth) / 2,
      offsetY: 0,
    };
  }

  const renderedHeight = width / WORLD_ASPECT_RATIO;
  return {
    width,
    height,
    renderedWidth: width,
    renderedHeight,
    offsetX: 0,
    offsetY: (height - renderedHeight) / 2,
  };
}

function projectPoint(metrics: MapMetrics, mapPoint: AtlasMapPoint) {
  return {
    x: metrics.offsetX + (mapPoint.xPct / 100) * metrics.renderedWidth,
    y: metrics.offsetY + (mapPoint.yPct / 100) * metrics.renderedHeight,
  };
}

function resolveDelegationAnchorPoint(
  delegation: AtlasDelegation,
  centersByIso: CountryCentersByIso,
): AtlasMapPoint | null {
  const iso2 = toSvgCountryIso2(delegation.countryCode).toLowerCase();
  return delegation.mapPoint ?? centersByIso[iso2] ?? null;
}

function formatUtcMoment(isoDate: string) {
  const parsed = DateTime.fromISO(isoDate).toUTC();
  if (!parsed.isValid) {
    return "Schedule pending";
  }

  if (parsed.hasSame(DateTime.utc(), "day")) {
    return `Today, ${parsed.toFormat("HH:mm 'UTC'")}`;
  }

  return parsed.toFormat("dd LLL, HH:mm 'UTC'");
}

function formatDeadlineHint(isoDate: string) {
  const parsed = DateTime.fromISO(isoDate).toUTC();
  if (!parsed.isValid) {
    return "Timeline sync in progress";
  }

  const relative = parsed.toRelative({ base: DateTime.utc(), style: "short" });
  if (!relative) {
    return formatUtcMoment(isoDate);
  }

  const compact = relative.replace("in ", "");
  return `Due in ${compact}`;
}

export function InteractiveGlobalMap({
  delegations,
  selectedDelegationId,
  onSelectDelegation,
  activeVotes,
  upcomingEvents,
  sessionRole,
  onOpenUpcomingEvent,
}: InteractiveGlobalMapProps) {
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const [isOpeningThread, setIsOpeningThread] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [meetingDialogPreset, setMeetingDialogPreset] = useState<MeetingRequestPreset | undefined>();
  const [hostSize, setHostSize] = useState({ width: 0, height: 0 });
  const [popoverSize, setPopoverSize] = useState({ width: 0, height: 0 });
  const [countryCentersByIso, setCountryCentersByIso] = useState<CountryCentersByIso>({});

  const selectedDelegation = useMemo(() => {
    if (!selectedDelegationId) {
      return null;
    }

    return delegations.find((delegation) => delegation.id === selectedDelegationId) ?? null;
  }, [delegations, selectedDelegationId]);

  const selectedCountryDelegation = selectedDelegation && selectedDelegation.kind === "country" ? selectedDelegation : null;

  const selectedMembers = useMemo(() => {
    const previews = selectedCountryDelegation?.memberPreviews ?? [];
    const filled = previews.slice(0, 2);

    while (filled.length < 2) {
      filled.push({
        id: `placeholder-${filled.length}`,
        name: `Delegate ${filled.length + 1}`,
        role: "delegate",
        displayRole: "Representative",
        mediaOutlet: "Independent",
        avatarUrl: null,
        positionPaperSummary: null,
      });
    }

    return filled;
  }, [selectedCountryDelegation]);

  const activeCountryDelegations = useMemo(
    () =>
      delegations
        .filter((delegation) => delegation.kind === "country" && delegation.status === "active")
        .sort((left, right) => left.name.localeCompare(right.name)),
    [delegations],
  );

  const metrics = useMemo(() => toMapMetrics(hostSize.width, hostSize.height), [hostSize.height, hostSize.width]);

  const selectedAnchor = useMemo(() => {
    if (!selectedCountryDelegation || !metrics) {
      return null;
    }

    const anchorPoint = resolveDelegationAnchorPoint(selectedCountryDelegation, countryCentersByIso);
    if (!anchorPoint) {
      return null;
    }

    return projectPoint(metrics, anchorPoint);
  }, [countryCentersByIso, metrics, selectedCountryDelegation]);

  const popoverPlacement = useMemo(() => {
    if (!selectedAnchor || !metrics) {
      return null;
    }

    const margin = 10;
    const width = Math.max(260, Math.min(popoverSize.width || 340, metrics.width - margin * 2));
    const height = popoverSize.height || 340;
    const gap = 14;

    const candidates = [
      { left: selectedAnchor.x + gap, top: selectedAnchor.y - height - 10 },
      { left: selectedAnchor.x - width - gap, top: selectedAnchor.y - height - 10 },
      { left: selectedAnchor.x + gap, top: selectedAnchor.y + 10 },
      { left: selectedAnchor.x - width - gap, top: selectedAnchor.y + 10 },
    ];

    const fits = (candidate: { left: number; top: number }) =>
      candidate.left >= margin &&
      candidate.top >= margin &&
      candidate.left + width <= metrics.width - margin &&
      candidate.top + height <= metrics.height - margin;

    const picked = candidates.find(fits) ?? candidates[0];

    return {
      left: clamp(picked.left, margin, metrics.width - width - margin),
      top: clamp(picked.top, margin, metrics.height - height - margin),
      width,
    };
  }, [metrics, popoverSize.height, popoverSize.width, selectedAnchor]);

  const futureUpcomingEvents = useMemo(() => {
    return upcomingEvents
      .map((event) => ({ event, startsAt: DateTime.fromISO(event.startsAtIso).toUTC() }))
      .filter((entry) => entry.startsAt.isValid)
      .sort((left, right) => left.startsAt.toMillis() - right.startsAt.toMillis())
      .filter((entry) => entry.startsAt >= DateTime.utc().minus({ minutes: 30 }));
  }, [upcomingEvents]);

  const nextDeadlineEvent = useMemo(() => futureUpcomingEvents[0]?.event ?? null, [futureUpcomingEvents]);

  const pressEvent = useMemo(
    () =>
      futureUpcomingEvents.find((entry) => /press|conference|summit/i.test(entry.event.title))?.event ??
      futureUpcomingEvents[1]?.event ??
      futureUpcomingEvents[0]?.event ??
      null,
    [futureUpcomingEvents],
  );

  const voteCard = useMemo(() => {
    const vote = activeVotes[0];
    if (!vote) {
      return {
        label: "Parliament",
        title: "Parliamentary floor on stand by",
        detail: "No open vote in progress",
        actionLabel: "Open parliament",
      };
    }

    return {
      label: "Parliament",
      title: vote.title,
      detail: `${vote.ballotCount} votes in progress`,
      actionLabel: "Open live vote",
    };
  }, [activeVotes]);

  const deadlineCard = useMemo(() => {
    const nextDeadline = nextDeadlineEvent;
    if (!nextDeadline) {
      return {
        label: "Stand on Floor",
        title: "Next deadline to be announced",
        detail: "Timeline sync in progress",
        actionLabel: isAdminLike(sessionRole) ? "Manage deadlines" : "View timeline",
      };
    }

    return {
      label: "Stand on Floor",
      title: nextDeadline.title,
      detail: formatDeadlineHint(nextDeadline.startsAtIso),
      actionLabel: "Open checkpoint",
    };
  }, [nextDeadlineEvent, sessionRole]);

  const pressCard = useMemo(() => {
    if (!pressEvent) {
      return {
        label: "Unstandby",
        title: "Press conference pending",
        detail: "No summit scheduled yet",
        actionLabel: "Open newsroom",
      };
    }

    return {
      label: "Unstandby",
      title: pressEvent.title,
      detail: formatUtcMoment(pressEvent.startsAtIso),
      actionLabel: "Open briefing",
    };
  }, [pressEvent]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedDelegationId]);

  useEffect(() => {
    setFeedback(null);
  }, [selectedDelegationId]);

  useEffect(() => {
    const element = mapHostRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const first = entries[0];
      if (!first) return;
      const { width, height } = first.contentRect;
      setHostSize((current) =>
        current.width === width && current.height === height ? current : { width, height },
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = popoverRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const first = entries[0];
      if (!first) return;
      const { width, height } = first.contentRect;
      setPopoverSize((current) =>
        current.width === width && current.height === height ? current : { width, height },
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [selectedCountryDelegation?.id]);

  useEffect(() => {
    if (!selectedCountryDelegation) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onSelectDelegation(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onSelectDelegation, selectedCountryDelegation]);

  useEffect(() => {
    if (!selectedCountryDelegation) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (popoverRef.current?.contains(target)) {
        return;
      }

      if (target.closest("[data-country-shape='true']") || target.closest("[data-map-delegation-list='true']")) {
        return;
      }

      if (!stageRef.current?.contains(target)) {
        return;
      }

      onSelectDelegation(null);
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [onSelectDelegation, selectedCountryDelegation]);

  function handleCountrySelect(nextId: string | null) {
    if (!nextId) {
      onSelectDelegation(null);
      return;
    }

    if (nextId === selectedDelegationId) {
      onSelectDelegation(null);
      return;
    }

    onSelectDelegation(nextId);
  }

  function scrollToUpcomingEvents() {
    const anchor = document.getElementById("upcoming-events-anchor");
    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleVoteCardClick() {
    router.push("/votes");
  }

  function handleDeadlineCardClick() {
    if (nextDeadlineEvent) {
      onOpenUpcomingEvent?.(nextDeadlineEvent.id);
      scrollToUpcomingEvents();
      return;
    }

    if (isAdminLike(sessionRole)) {
      router.push("/workspace/admin");
      return;
    }

    scrollToUpcomingEvents();
  }

  function handlePressCardClick() {
    if (pressEvent) {
      onOpenUpcomingEvent?.(pressEvent.id);
      return;
    }

    if (isAdminLike(sessionRole)) {
      router.push("/workspace/admin");
      return;
    }

    router.push("/newsroom");
  }

  async function openDelegationThread() {
    if (!selectedCountryDelegation) {
      return;
    }

    setFeedback(null);
    setIsOpeningThread(true);

    try {
      const response = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomType: "team",
          targetTeamId: selectedCountryDelegation.id,
          name: `Delegation channel · ${selectedCountryDelegation.name}`,
          topic: `team:${selectedCountryDelegation.id}`,
        }),
      });

      if (!response.ok) {
        setFeedback("Unable to open delegation thread.");
        return;
      }

      const room = (await response.json()) as { id: string };
      router.push(`/chat/${room.id}`);
    } finally {
      setIsOpeningThread(false);
    }
  }

  function requestMeeting() {
    if (!selectedCountryDelegation) {
      return;
    }

    setFeedback(null);
    setMeetingDialogPreset({
      recipientMode: "team",
      targetTeamId: selectedCountryDelegation.id,
      title: `Bilateral with ${selectedCountryDelegation.name}`,
      note: "Request prepared from Global Activity Map.",
    });
    setIsMeetingDialogOpen(true);
  }

  const delegationList = (
    <div className="space-y-2">
      {activeCountryDelegations.length === 0 ? (
        <p className="rounded-lg border border-ink-border bg-white p-2 text-xs text-ink/70">
          No active country delegation available.
        </p>
      ) : (
        activeCountryDelegations.map((delegation) => {
          const isSelected = delegation.id === selectedDelegationId;
          return (
            <button
              key={delegation.id}
              type="button"
              onClick={() => handleCountrySelect(delegation.id)}
              aria-pressed={isSelected}
              className={`w-full rounded-lg border px-3 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-ink-blue/45 ${
                isSelected
                  ? "border-blue-300 bg-blue-50 text-blue-900"
                  : "border-ink-border bg-white text-ink hover:border-ink-blue/45"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">
                  <span className="mr-2 align-middle text-base">{delegation.flagEmoji}</span>
                  <span className="align-middle">{delegation.name}</span>
                </p>
                <span className="rounded-full bg-ivory px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/70">
                  {delegation.status}
                </span>
              </div>
            </button>
          );
        })
      )}
    </div>
  );

  return (
    <div className="w-full space-y-2">
      <MeetingRequestDialog
        isOpen={isMeetingDialogOpen}
        onClose={() => setIsMeetingDialogOpen(false)}
        preset={meetingDialogPreset}
        onSuccess={() => setFeedback("Meeting request sent.")}
      />

      <div className="relative isolate w-full overflow-hidden rounded-3xl border border-ink-border/80 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.11)]">
        <div ref={stageRef} className="grid w-full overflow-hidden lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div ref={mapHostRef} className="relative aspect-[1010/666] w-full overflow-hidden bg-[#fcfdff]">
            <ClickableWorldMap
              delegations={delegations}
              selectedDelegationId={selectedDelegationId}
              onSelectDelegation={handleCountrySelect}
              onCountryCentersChange={setCountryCentersByIso}
            />

            <div className="pointer-events-none absolute left-4 top-4 z-40 inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 shadow-lg backdrop-blur-md">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
              </span>
              <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-ink">Live Simulation • 2026</span>
            </div>

            {selectedCountryDelegation && popoverPlacement ? (
              <div
                ref={popoverRef}
                className="absolute z-[90] max-h-[80%] overflow-y-auto rounded-xl border border-slate-200/80 bg-white/97 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.28)] backdrop-blur-md"
                style={{ left: popoverPlacement.left, top: popoverPlacement.top, width: popoverPlacement.width }}
              >
                <button
                  ref={closeButtonRef}
                  onClick={() => onSelectDelegation(null)}
                  className="absolute right-2 top-2 rounded-md p-1 text-ink/50 hover:bg-ink/5 hover:text-ink"
                  aria-label="Close delegation card"
                >
                  <X className="h-4 w-4" />
                </button>

                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Delegation</p>
                <h3 className="mt-1 flex items-center gap-2 font-serif text-2xl font-bold text-ink">
                  <span className="text-2xl leading-none">{selectedCountryDelegation.flagEmoji}</span>
                  {selectedCountryDelegation.name}
                </h3>
                <p className="mt-1 text-xs uppercase tracking-[0.08em] text-ink/55">
                  {selectedCountryDelegation.region} • {selectedCountryDelegation.kind}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  {selectedMembers.map((member) => (
                    <div key={member.id} className="relative">
                      {member.avatarUrl ? (
                        <Image
                          src={member.avatarUrl}
                          alt={member.name}
                          width={32}
                          height={32}
                          unoptimized
                          className="h-8 w-8 rounded-full border border-ink-border object-cover"
                        />
                      ) : (
                        <span className="grid h-8 w-8 place-items-center rounded-full border border-ink-border bg-ivory text-[10px] font-bold text-ink/70">
                          {member.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-sm text-ink/80">{selectedCountryDelegation.stance}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedCountryDelegation.priorities.map((priority) => (
                    <span
                      key={priority}
                      className="rounded-md border border-ink-border bg-ivory px-2 py-1 text-[11px] text-ink/75"
                    >
                      {priority}
                    </span>
                  ))}
                </div>

                <div className="mt-3 rounded-lg border border-ink-border bg-ivory/70 p-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink/55">Recent actions</p>
                  <ul className="mt-1 space-y-1 text-xs text-ink/75">
                    {selectedCountryDelegation.latestActions.slice(0, 2).map((action) => (
                      <li key={action}>• {action}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 grid gap-2">
                  <button
                    onClick={requestMeeting}
                    className="inline-flex items-center justify-between rounded-lg border border-ink-blue/30 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-ink-blue hover:bg-blue-50 disabled:opacity-60"
                  >
                    Request meeting
                    <Users className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={openDelegationThread}
                    disabled={isOpeningThread}
                    className="inline-flex items-center justify-between rounded-lg border border-ink-border bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-ink hover:bg-ivory disabled:opacity-60"
                  >
                    Open delegation thread
                    {isOpeningThread ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {feedback ? <p className="mt-2 text-xs text-ink/65">{feedback}</p> : null}
              </div>
            ) : null}
          </div>

          <aside data-map-delegation-list="true" className="border-t border-ink-border/70 bg-slate-50 lg:border-l lg:border-t-0">
            <details open className="group lg:hidden">
              <summary className="cursor-pointer list-none px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink/70 [&::-webkit-details-marker]:hidden">
                <div className="flex items-center justify-between">
                  <span>Delegations</span>
                  <span className="text-[10px] text-ink/55 group-open:hidden">Tap to open</span>
                </div>
              </summary>
              <div className="max-h-72 overflow-y-auto border-t border-ink-border/60 px-3 py-3">{delegationList}</div>
            </details>

            <div className="hidden h-full flex-col lg:flex">
              <div className="border-b border-ink-border/60 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink/70">Delegations</p>
                <p className="mt-1 text-[11px] text-ink/60">Select a country to open its profile.</p>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3">{delegationList}</div>
            </div>
          </aside>
        </div>
        {/* Event Cards as Footer inside the map container */}
        <div className="grid gap-3 border-t border-ink-border/30 bg-slate-50 p-4 md:grid-cols-3">
          <button
            type="button"
            onClick={handleVoteCardClick}
            className="group relative overflow-hidden rounded-2xl border border-ink-border/80 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-red-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-300/70 md:flex md:flex-col"
          >
            <div className="flex items-center justify-between">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-red-100/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-red-700 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" /> {voteCard.label}
              </p>
              <ArrowRight className="h-4 w-4 text-ink/40 transition group-hover:translate-x-1 group-hover:text-red-600" />
            </div>
            <p className="mt-3 font-serif text-[17px] font-bold leading-tight text-ink md:min-h-[2.5rem] md:[display:-webkit-box] md:[-webkit-line-clamp:2] md:[-webkit-box-orient:vertical] md:overflow-hidden">
              {voteCard.title}
            </p>
            <p className="mt-2 text-[13px] font-medium text-ink/65 md:min-h-[1.5rem] md:[display:-webkit-box] md:[-webkit-line-clamp:1] md:[-webkit-box-orient:vertical] md:overflow-hidden">
              {voteCard.detail}
            </p>
          </button>

          <button
            type="button"
            onClick={handleDeadlineCardClick}
            className="group relative overflow-hidden rounded-2xl border border-ink-border/80 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300/75 md:flex md:flex-col"
          >
            <div className="flex items-center justify-between">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700 backdrop-blur-md">
                <CalendarClock className="h-3 w-3" /> {deadlineCard.label}
              </p>
              <ArrowRight className="h-4 w-4 text-ink/40 transition group-hover:translate-x-1 group-hover:text-amber-600" />
            </div>
            <p className="mt-3 font-serif text-[17px] font-bold leading-tight text-ink md:min-h-[2.5rem] md:[display:-webkit-box] md:[-webkit-line-clamp:2] md:[-webkit-box-orient:vertical] md:overflow-hidden">
              {deadlineCard.title}
            </p>
            <p className="mt-2 text-[13px] font-medium text-ink/65 md:min-h-[1.5rem] md:[display:-webkit-box] md:[-webkit-line-clamp:1] md:[-webkit-box-orient:vertical] md:overflow-hidden">
              <span className="font-semibold text-amber-700">{deadlineCard.detail}</span>
            </p>
          </button>

          <button
            type="button"
            onClick={handlePressCardClick}
            className="group relative overflow-hidden rounded-2xl border border-ink-border/80 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300/75 md:flex md:flex-col"
          >
            <div className="flex items-center justify-between">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700 backdrop-blur-md">
                <Mic2 className="h-3 w-3" /> {pressCard.label}
              </p>
              <div className="flex items-center justify-center rounded-md border border-ink-border bg-white px-2 py-0.5 shadow-sm transition group-hover:border-blue-400">
                <span className="text-[10px] font-bold text-blue-700">Join</span>
              </div>
            </div>
            <p className="mt-3 font-serif text-[17px] font-bold leading-tight text-ink md:min-h-[2.5rem] md:[display:-webkit-box] md:[-webkit-line-clamp:2] md:[-webkit-box-orient:vertical] md:overflow-hidden">
              {pressCard.title}
            </p>
            <p className="mt-2 text-[13px] font-medium text-ink/65 md:min-h-[1.5rem] md:[display:-webkit-box] md:[-webkit-line-clamp:1] md:[-webkit-box-orient:vertical] md:overflow-hidden">
              {pressCard.detail}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
