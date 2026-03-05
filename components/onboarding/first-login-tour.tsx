"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

type TourStep = {
  id: string;
  title: string;
  description: string;
  bullets?: string[];
  cta?: { label: string; href: string };
};

function toRoleLabel(role: string | null | undefined): string {
  if (role === "delegate") return "Delegate";
  if (role === "journalist") return "Journalist";
  if (role === "leader") return "Leader";
  if (role === "lobbyist") return "Lobbyist";
  if (role === "admin") return "Admin";
  if (role === "game_master") return "Game Master";
  return "Participant";
}

function getRoleSteps(role: string | null | undefined): TourStep[] {
  switch (role) {
    case "delegate":
      return [
        {
          id: "delegate-start",
          title: "Where to start (Delegation)",
          description:
            "Your main space is the Delegation Workspace. This is where you prepare your negotiation strategy and coordinate your team.",
          bullets: [
            "Open Workspace to prepare your positions and your position paper.",
            "From the Dashboard, click a delegation to see context and latest actions.",
            "Use Votes to monitor and vote when ballots are open.",
          ],
          cta: { label: "Go to Workspace", href: "/workspace/delegate" },
        },
      ];
    case "journalist":
      return [
        {
          id: "journalist-start",
          title: "Where to start (Newsroom)",
          description:
            "Your main space is the Newsroom. You write articles, track events, and publish according to the review workflow.",
          bullets: [
            "Open Newsroom to write and submit your articles.",
            "The Dashboard gives you a live view (map, votes, breaking news).",
            "Use Messages to coordinate interviews and confirmations.",
          ],
          cta: { label: "Go to Newsroom", href: "/newsroom" },
        },
      ];
    case "lobbyist":
      return [
        {
          id: "lobbyist-start",
          title: "Where to start (Lobby)",
          description:
            "Your main space is the Lobbyist Workspace. You track ongoing dynamics and coordinate exchanges with delegations.",
          bullets: [
            "Open Workspace for your lobbyist command hub.",
            "Use Messages for secure communications.",
            "Monitor Votes to act at the right moment.",
          ],
          cta: { label: "Go to Workspace", href: "/workspace/lobbyist" },
        },
      ];
    case "leader":
      return [
        {
          id: "leader-start",
          title: "Where to start (Leadership)",
          description:
            "Your main space is Leadership Command. You steer the simulation flow and arbitrate publications and votes.",
          bullets: [
            "Open Workspace to access Leadership Command.",
            "The Dashboard is your live cockpit (map, votes, newsroom).",
            "Use Votes and Newsroom to validate and activate decisions as the simulation evolves.",
          ],
          cta: { label: "Go to Leadership Command", href: "/workspace/leader" },
        },
      ];
    case "admin":
    case "game_master":
      return [
        {
          id: "admin-start",
          title: "Where to start (Admin)",
          description:
            "You have access to the Admin/Professor portal. It is the control center for simulation governance, content, and global monitoring.",
          bullets: [
            "Open Workspace for the Admin portal.",
            "The Dashboard gives you a consolidated view of live activity.",
            "Then navigate to Newsroom, Votes, or Surveys as needed.",
          ],
          cta: { label: "Go to Admin Portal", href: "/workspace/admin" },
        },
      ];
    default:
      return [
        {
          id: "generic-start",
          title: "Where to start",
          description:
            "Start from the Dashboard for an overview, then explore sections based on your mission.",
          bullets: [
            "Dashboard = map + news + votes + deadlines.",
            "Workspace = role-based working area.",
            "Surveys = questionnaires and feedback.",
          ],
          cta: { label: "Go to Dashboard", href: "/dashboard" },
        },
      ];
  }
}

function buildSteps(userName: string, role: string | null | undefined): TourStep[] {
  const roleLabel = toRoleLabel(role);
  const steps: TourStep[] = [
    {
      id: "welcome",
      title: `Welcome, ${userName || "participant"}!`,
      description:
        "Here is a quick guided tour (about 2 minutes) to help you navigate SimuVaction. You can skip it at any time.",
      bullets: [`Detected role: ${roleLabel}`, "This tour is shown only on first login."],
    },
    ...getRoleSteps(role),
    {
      id: "dashboard",
      title: "Dashboard = live overview",
      description:
        "The Dashboard centralizes essentials: delegation map, active votes, meetings, and newsroom signals.",
      bullets: [
        "Click a delegation on the map or in the Delegations list.",
        "Monitor open votes and upcoming deadlines.",
        "Use this page as your simulation cockpit.",
      ],
      cta: { label: "Open Dashboard", href: "/dashboard" },
    },
    {
      id: "comms",
      title: "Messages and coordination",
      description:
        "The platform is designed for fast execution: communication, coordination, and actions in one workflow.",
      bullets: [
        "Messages = discussions and coordination (rooms/teams).",
        "Notifications help you avoid missing key events (votes, mentions, publications).",
      ],
      cta: { label: "Open Messages", href: "/chat" },
    },
    {
      id: "surveys",
      title: "Surveys (feedback and progression)",
      description:
        "Here you will find conference satisfaction forms and the longitudinal discernment questionnaire.",
      bullets: [
        "Complete surveys when available (one response per wave/survey).",
        "Leaders/admins can access aggregate metrics when authorized.",
      ],
      cta: { label: "Open Surveys", href: "/surveys" },
    },
    {
      id: "done",
      title: "You are ready",
      description:
        "You can revisit quick guidance through SimuBot (bottom-right). Have a great simulation.",
      bullets: ["Tip: if you are unsure where to go, start with Dashboard, then Workspace.", "You can close this tour now."],
    },
  ];

  return steps;
}

export function FirstLoginTour({
  userName,
  role,
  isCompleted,
}: {
  userName: string;
  role: string | null | undefined;
  isCompleted: boolean;
}) {
  const router = useRouter();
  const steps = useMemo(() => buildSteps(userName, role), [userName, role]);

  const [isOpen, setIsOpen] = useState(() => !isCompleted);
  const [stepIndex, setStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isCompleted) {
      setIsOpen(true);
    }
  }, [isCompleted]);

  const markCompleted = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/onboarding/complete", { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Request failed.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      setSaveError(message);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleSkip = useCallback(async () => {
    try {
      await markCompleted();
    } catch {
      // If we can't persist, keep the tour open so users can retry.
      return;
    }
    setIsOpen(false);
  }, [markCompleted]);

  const handleFinish = useCallback(async () => {
    try {
      await markCompleted();
    } catch {
      return;
    }
    setIsOpen(false);
  }, [markCompleted]);

  const handleNext = useCallback(() => {
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }, [steps.length]);

  const handlePrev = useCallback(() => {
    setStepIndex((index) => Math.max(index - 1, 0));
  }, []);

  const step = steps[stepIndex];

  const handleCtaClick = useCallback(() => {
    if (!step.cta) return;
    router.push(step.cta.href);
    router.refresh();
  }, [router, step.cta]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        void handleSkip();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSkip, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-4 py-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Guided tour"
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-ink-border bg-[var(--color-surface)] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-border/80 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
              Guided Tour • Step {stepIndex + 1}/{steps.length}
            </p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-ink">{step.title}</h2>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="rounded-lg p-2 text-ink/50 transition hover:bg-black/5 hover:text-ink"
            aria-label="Close guided tour"
            disabled={isSaving}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-ink/80">{step.description}</p>

          {step.bullets && step.bullets.length > 0 ? (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink/75">
              {step.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}

          {step.cta ? (
            <button
              type="button"
              onClick={handleCtaClick}
              className="mt-5 inline-flex items-center justify-center rounded-xl border border-ink-border bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-ink-blue/40"
            >
              {step.cta.label}
            </button>
          ) : null}

          {saveError ? <p className="mt-5 text-sm font-semibold text-alert-red">{saveError}</p> : null}
        </div>

        <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-ink-border/80 px-5 py-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-ink/70 transition hover:bg-black/5"
            disabled={isSaving}
          >
            Skip tour
          </button>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="rounded-xl border border-ink-border bg-white px-4 py-2 text-sm font-semibold text-ink/70 shadow-sm transition hover:border-ink-blue/40 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving || stepIndex === 0}
            >
              Previous
            </button>

            {stepIndex >= steps.length - 1 ? (
              <button
                type="button"
                onClick={handleFinish}
                className="rounded-xl bg-ink-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-blue-hover disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Finish"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl bg-ink-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-blue-hover disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSaving}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
