"use client";

import { useEffect, useMemo, useState } from "react";
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
  if (role === "delegate") return "Délégué";
  if (role === "journalist") return "Journaliste";
  if (role === "leader") return "Leadership";
  if (role === "lobbyist") return "Lobbyiste";
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
          title: "Par où commencer (Délégation)",
          description:
            "Ton espace principal est le Workspace de délégation. C’est là que tu prépares ta stratégie de négociation et que tu coordonnes ton équipe.",
          bullets: [
            "Ouvre “Workspace” pour préparer tes positions et ton position paper.",
            "Sur le Dashboard, clique une délégation pour voir le contexte et les dernières actions.",
            "Utilise “Votes” pour suivre et voter quand des scrutins sont ouverts.",
          ],
          cta: { label: "Aller au Workspace", href: "/workspace/delegate" },
        },
      ];
    case "journalist":
      return [
        {
          id: "journalist-start",
          title: "Par où commencer (Newsroom)",
          description:
            "Ton espace principal est la Newsroom. Tu y rédiges des articles, tu suis ce qui se passe et tu publies (selon le workflow de validation).",
          bullets: [
            "Ouvre “Newsroom” pour écrire et soumettre tes articles.",
            "Le Dashboard te donne une vue live (carte, votes, breaking news).",
            "Utilise “Messages” pour coordonner interviews et confirmations.",
          ],
          cta: { label: "Aller à la Newsroom", href: "/newsroom" },
        },
      ];
    case "lobbyist":
      return [
        {
          id: "lobbyist-start",
          title: "Par où commencer (Lobby)",
          description:
            "Ton espace principal est le Workspace lobbyiste. Tu y suis les dynamiques en cours et tu coordonnes tes échanges avec les délégations.",
          bullets: [
            "Ouvre “Workspace” pour ton hub lobbyiste.",
            "Utilise “Messages” pour tes communications sécurisées.",
            "Surveille “Votes” pour agir au bon moment.",
          ],
          cta: { label: "Aller au Workspace", href: "/workspace/lobbyist" },
        },
      ];
    case "leader":
      return [
        {
          id: "leader-start",
          title: "Par où commencer (Leadership)",
          description:
            "Ton espace principal est le Leadership Command. Tu pilotes le déroulement de la simulation et tu arbitres les publications et les votes.",
          bullets: [
            "Ouvre “Workspace” pour accéder au Leadership Command.",
            "Le Dashboard te donne le cockpit live (carte, votes, newsroom).",
            "Passe par “Votes” et “Newsroom” pour valider/activer selon le rythme de la simulation.",
          ],
          cta: { label: "Aller au Leadership Command", href: "/workspace/leader" },
        },
      ];
    case "admin":
    case "game_master":
      return [
        {
          id: "admin-start",
          title: "Par où commencer (Admin)",
          description:
            "Tu as accès au portail Admin/Professeur. C’est le centre de contrôle pour cadrer la simulation, les contenus et le suivi global.",
          bullets: [
            "Ouvre “Workspace” pour le portail Admin.",
            "Le Dashboard te donne une vue synthèse de l’activité live.",
            "Tu peux ensuite naviguer vers Newsroom/Votes/Surveys selon les besoins.",
          ],
          cta: { label: "Aller au portail Admin", href: "/workspace/admin" },
        },
      ];
    default:
      return [
        {
          id: "generic-start",
          title: "Par où commencer",
          description:
            "Commence par le Dashboard pour une vue d’ensemble, puis explore les sections selon ta mission.",
          bullets: [
            "Dashboard = carte + actualité + votes + échéances.",
            "Workspace = espace de travail selon ton rôle.",
            "Surveys = questionnaires et feedback.",
          ],
          cta: { label: "Aller au Dashboard", href: "/dashboard" },
        },
      ];
  }
}

function buildSteps(userName: string, role: string | null | undefined): TourStep[] {
  const roleLabel = toRoleLabel(role);
  const steps: TourStep[] = [
    {
      id: "welcome",
      title: `Bienvenue, ${userName || "participant"} !`,
      description:
        "Voici un tour guidé rapide (2 minutes) pour te repérer dans SimuVaction. Tu peux le passer à tout moment.",
      bullets: [`Rôle détecté: ${roleLabel}`, "Le tour ne s’affiche qu’à la première connexion."],
    },
    ...getRoleSteps(role),
    {
      id: "dashboard",
      title: "Dashboard = vue live",
      description:
        "Le Dashboard rassemble l’essentiel: carte des délégations, votes actifs, meetings et signaux de la newsroom.",
      bullets: [
        "Clique une délégation sur la carte ou dans la liste “Delegations”.",
        "Surveille les votes ouverts et les échéances à venir.",
        "Utilise cette page comme “cockpit” pendant la simulation.",
      ],
      cta: { label: "Ouvrir le Dashboard", href: "/dashboard" },
    },
    {
      id: "comms",
      title: "Messages & coordination",
      description:
        "La plateforme est pensée pour travailler vite: échanges, coordination, et actions dans un même flux.",
      bullets: [
        "“Messages” = discussions et coordination (rooms/équipes).",
        "“Notifications” t’aide à ne rien rater (votes, mentions, publications).",
      ],
      cta: { label: "Ouvrir Messages", href: "/chat" },
    },
    {
      id: "surveys",
      title: "Surveys (feedback & progression)",
      description:
        "Tu trouveras ici les formulaires de satisfaction (conférences) et le questionnaire longitudinal de discernement.",
      bullets: [
        "Réponds aux surveys quand ils sont disponibles (1 réponse par vague/sondage).",
        "Les leaders/admin peuvent consulter des stats agrégées (si autorisés).",
      ],
      cta: { label: "Ouvrir Surveys", href: "/surveys" },
    },
    {
      id: "done",
      title: "C’est parti",
      description:
        "Tu peux relire les conseils rapides via SimuBot (en bas à droite). Bon travail et bonne simulation.",
      bullets: ["Astuce: si tu es perdu, commence par “Dashboard”, puis “Workspace”.", "Tu peux fermer ce tour maintenant."],
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function markCompleted() {
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
  }

  async function handleSkip() {
    try {
      await markCompleted();
    } catch {
      // If we can't persist, keep the tour open so users can retry.
      return;
    }
    setIsOpen(false);
  }

  async function handleFinish() {
    try {
      await markCompleted();
    } catch {
      return;
    }
    setIsOpen(false);
  }

  function handleNext() {
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }

  function handlePrev() {
    setStepIndex((index) => Math.max(index - 1, 0));
  }

  const step = steps[stepIndex];

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
              Tour guidé • Étape {stepIndex + 1}/{steps.length}
            </p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-ink">{step.title}</h2>
          </div>

          <button
            type="button"
            onClick={() => void handleSkip()}
            className="rounded-lg p-2 text-ink/50 transition hover:bg-black/5 hover:text-ink"
            aria-label="Fermer le tour"
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
              onClick={() => {
                router.push(step.cta!.href);
                router.refresh();
              }}
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
            onClick={() => void handleSkip()}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-ink/70 transition hover:bg-black/5"
            disabled={isSaving}
          >
            Passer le tour
          </button>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="rounded-xl border border-ink-border bg-white px-4 py-2 text-sm font-semibold text-ink/70 shadow-sm transition hover:border-ink-blue/40 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving || stepIndex === 0}
            >
              Précédent
            </button>

            {stepIndex >= steps.length - 1 ? (
              <button
                type="button"
                onClick={() => void handleFinish()}
                className="rounded-xl bg-ink-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-blue-hover disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSaving}
              >
                {isSaving ? "Enregistrement…" : "Terminer"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl bg-ink-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-blue-hover disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSaving}
              >
                Suivant
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

