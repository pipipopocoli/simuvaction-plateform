"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/commons";

type ConferenceQuestion = {
  id: string;
  prompt: string;
  questionType: "rating" | "text";
  required: boolean;
  orderIndex: number;
};

type ConferenceSurvey = {
  id: string;
  conferenceNumber: number;
  title: string;
  description: string | null;
  questions: ConferenceQuestion[];
  response: {
    id: string;
    answersJson: Array<{
      questionId: string;
      rating?: number;
      textValue?: string;
    }>;
    updatedAt: string;
  } | null;
  hasResponded: boolean;
};

type DiscernmentWavePayload = {
  id: string;
  label: string;
  orderIndex: number;
  opensAt: string;
  closesAt: string | null;
  template: {
    id: string;
    title: string;
    description: string | null;
    questions: string[];
  };
  response: {
    id: string;
    answersJson: {
      answers?: number[];
      notes?: string | null;
    };
    score: number | null;
  } | null;
};

type InsightsPayload = {
  conferenceInsights: Array<{
    surveyId: string;
    conferenceNumber: number;
    title: string;
    responseCount: number;
    averageRating: number | null;
  }>;
  discernmentInsights: Array<{
    waveId: string;
    label: string;
    orderIndex: number;
    responseCount: number;
    averageScore: number | null;
  }>;
};

type AnswerDraft = {
  rating?: number;
  textValue?: string;
};

export function SurveysClient({ role }: { role: string | null }) {
  const [surveys, setSurveys] = useState<ConferenceSurvey[]>([]);
  const [wave, setWave] = useState<DiscernmentWavePayload | null>(null);
  const [conferenceAnswers, setConferenceAnswers] = useState<Record<string, Record<string, AnswerDraft>>>({});
  const [discernmentAnswers, setDiscernmentAnswers] = useState<number[]>([]);
  const [discernmentNotes, setDiscernmentNotes] = useState("");
  const [insights, setInsights] = useState<InsightsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState<string | null>(null);

  const isInsightRole = role === "leader" || role === "admin" || role === "game_master";

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      const [conferenceResponse, waveResponse, insightsResponse] = await Promise.all([
        fetch("/api/surveys/conferences", { cache: "no-store" }),
        fetch("/api/surveys/discernment/current", { cache: "no-store" }),
        isInsightRole ? fetch("/api/admin/surveys/insights", { cache: "no-store" }) : Promise.resolve(null),
      ]);

      if (!active) return;

      const conferencePayload = await conferenceResponse.json().catch(() => ({ surveys: [] }));
      const wavePayload = await waveResponse.json().catch(() => ({ wave: null }));

      const loadedSurveys = (conferencePayload.surveys ?? []) as ConferenceSurvey[];
      setSurveys(loadedSurveys);

      const initialAnswers: Record<string, Record<string, AnswerDraft>> = {};
      for (const survey of loadedSurveys) {
        const questionDrafts: Record<string, AnswerDraft> = {};
        for (const question of survey.questions) {
          questionDrafts[question.id] = {};
        }
        for (const savedAnswer of survey.response?.answersJson ?? []) {
          questionDrafts[savedAnswer.questionId] = {
            rating: savedAnswer.rating,
            textValue: savedAnswer.textValue,
          };
        }
        initialAnswers[survey.id] = questionDrafts;
      }
      setConferenceAnswers(initialAnswers);

      const loadedWave = (wavePayload.wave ?? null) as DiscernmentWavePayload | null;
      setWave(loadedWave);
      setDiscernmentAnswers(
        Array.isArray(loadedWave?.response?.answersJson?.answers)
          ? loadedWave.response.answersJson.answers
          : Array.isArray(loadedWave?.template?.questions)
            ? new Array(loadedWave.template.questions.length).fill(3)
            : [],
      );
      setDiscernmentNotes(loadedWave?.response?.answersJson?.notes ?? "");

      if (insightsResponse && insightsResponse.ok) {
        const insightsPayload = (await insightsResponse.json().catch(() => null)) as InsightsPayload | null;
        setInsights(insightsPayload);
      }

      setIsLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [isInsightRole]);

  async function saveConferenceSurvey(survey: ConferenceSurvey) {
    setSaveState(`Saving ${survey.title}...`);
    const draft = conferenceAnswers[survey.id] ?? {};
    const answers = survey.questions
      .map((question) => {
        const value = draft[question.id] ?? {};
        return {
          questionId: question.id,
          rating: value.rating,
          textValue: value.textValue?.trim() || undefined,
        };
      })
      .filter((answer) => typeof answer.rating === "number" || typeof answer.textValue === "string");

    const response = await fetch(`/api/surveys/conferences/${survey.id}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setSaveState(payload.error ?? "Unable to save conference survey.");
      return;
    }

    setSaveState(`Saved: ${survey.title}`);
  }

  async function saveDiscernment() {
    if (!wave) {
      return;
    }

    setSaveState("Saving discernment questionnaire...");
    const response = await fetch("/api/surveys/discernment/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        waveId: wave.id,
        answers: discernmentAnswers,
        notes: discernmentNotes.trim() || undefined,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setSaveState(payload.error ?? "Unable to save discernment questionnaire.");
      return;
    }

    setSaveState(`Saved: ${wave.label}`);
  }

  const conferencePanels = surveys.map((survey) => (
        <Panel key={survey.id}>
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-ink">
              Conference {survey.conferenceNumber}: {survey.title}
            </h3>
            {survey.description ? (
              <p className="text-sm text-ink/70">{survey.description}</p>
            ) : null}
          </div>
          <div className="space-y-3">
            {survey.questions.map((question) => {
              const current = conferenceAnswers[survey.id]?.[question.id] ?? {};
              return (
                <div key={question.id} className="rounded-lg border border-ink-border/80 p-3">
                  <p className="text-sm font-medium text-ink">{question.prompt}</p>
                  {question.questionType === "rating" ? (
                    <select
                      className="mt-2 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                      value={current.rating ?? ""}
                      onChange={(event) =>
                        setConferenceAnswers((previous) => ({
                          ...previous,
                          [survey.id]: {
                            ...(previous[survey.id] ?? {}),
                            [question.id]: {
                              ...(previous[survey.id]?.[question.id] ?? {}),
                              rating: Number(event.target.value),
                            },
                          },
                        }))
                      }
                    >
                      <option value="">Select rating</option>
                      <option value={1}>1 - Very low</option>
                      <option value={2}>2 - Low</option>
                      <option value={3}>3 - Medium</option>
                      <option value={4}>4 - Good</option>
                      <option value={5}>5 - Excellent</option>
                    </select>
                  ) : (
                    <textarea
                      rows={3}
                      className="mt-2 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                      placeholder="Your feedback"
                      value={current.textValue ?? ""}
                      onChange={(event) =>
                        setConferenceAnswers((previous) => ({
                          ...previous,
                          [survey.id]: {
                            ...(previous[survey.id] ?? {}),
                            [question.id]: {
                              ...(previous[survey.id]?.[question.id] ?? {}),
                              textValue: event.target.value,
                            },
                          },
                        }))
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => saveConferenceSurvey(survey)}
              className="rounded bg-ink-blue px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Save conference feedback
            </button>
            {survey.hasResponded ? (
              <span className="text-xs text-emerald-700">Already submitted (editable).</span>
            ) : (
              <span className="text-xs text-ink/60">Pending submission.</span>
            )}
          </div>
        </Panel>
      ));

  if (isLoading) {
    return <p className="text-sm text-ink/70">Loading surveys...</p>;
  }

  return (
    <div className="space-y-6">
      {conferencePanels}

      <Panel>
        <h3 className="text-lg font-semibold text-ink">Discernment progression questionnaire</h3>
        {wave ? (
          <>
            <p className="mt-1 text-sm text-ink/70">
              {wave.label} · {wave.template.title}
            </p>
            {wave.template.description ? (
              <p className="text-sm text-ink/60">{wave.template.description}</p>
            ) : null}
            <div className="mt-4 space-y-3">
              {wave.template.questions.map((question, index) => (
                <div key={`${wave.id}-${index}`} className="rounded-lg border border-ink-border/80 p-3">
                  <p className="text-sm font-medium text-ink">{question}</p>
                  <select
                    className="mt-2 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                    value={discernmentAnswers[index] ?? 3}
                    onChange={(event) =>
                      setDiscernmentAnswers((previous) => {
                        const next = [...previous];
                        next[index] = Number(event.target.value);
                        return next;
                      })
                    }
                  >
                    <option value={1}>1 - Strongly disagree</option>
                    <option value={2}>2 - Disagree</option>
                    <option value={3}>3 - Neutral</option>
                    <option value={4}>4 - Agree</option>
                    <option value={5}>5 - Strongly agree</option>
                  </select>
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-ink">Optional notes</label>
                <textarea
                  rows={4}
                  className="mt-2 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                  value={discernmentNotes}
                  onChange={(event) => setDiscernmentNotes(event.target.value)}
                  placeholder="Describe key changes in your strategic discernment."
                />
              </div>
            </div>
            <button
              type="button"
              onClick={saveDiscernment}
              className="mt-4 rounded bg-ink-blue px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Save discernment response
            </button>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink/70">No active discernment wave configured yet.</p>
        )}
      </Panel>

      {insights ? (
        <Panel>
          <h3 className="text-lg font-semibold text-ink">Admin insights</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-ink">Conference satisfaction</p>
              <ul className="mt-2 space-y-2 text-sm text-ink/70">
                {insights.conferenceInsights.map((entry) => (
                  <li key={entry.surveyId}>
                    C{entry.conferenceNumber} · {entry.responseCount} responses · avg{" "}
                    {entry.averageRating ?? "n/a"}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Discernment progression</p>
              <ul className="mt-2 space-y-2 text-sm text-ink/70">
                {insights.discernmentInsights.map((entry) => (
                  <li key={entry.waveId}>
                    {entry.label} · {entry.responseCount} responses · avg score{" "}
                    {entry.averageScore ?? "n/a"}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>
      ) : null}

      {saveState ? (
        <p className="text-sm font-medium text-ink/80">{saveState}</p>
      ) : null}
    </div>
  );
}
