"use client";

import { useState } from "react";
import { Plus, Users, X } from "lucide-react";
import { ActionButton, Panel, StatusBadge } from "@/components/ui/commons";

export function AdminVotePanel() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<string[]>(["Yes", "No", "Abstain"]);
  const [visibility, setVisibility] = useState<"public" | "secret">("public");
  const [ballotMode, setBallotMode] = useState<"per_delegation" | "per_person">("per_delegation");
  const [quorumPercent, setQuorumPercent] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateVote() {
    if (!title.trim() || options.filter((option) => option.trim()).length < 2) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          status: "active",
          visibility,
          voteType: ballotMode,
          quorumPercent,
          options: options.filter((option) => option.trim() !== ""),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Vote creation failed." }));
        alert(payload.error ?? "Vote creation failed.");
        return;
      }

      setTitle("");
      setDescription("");
      setOptions(["Yes", "No", "Abstain"]);
      alert("Vote launched successfully.");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function addOption() {
    setOptions((prev) => [...prev, ""]);
  }

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((option, idx) => (idx === index ? value : option)));
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
  }

  return (
    <Panel className="space-y-5 p-4" variant="soft">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-serif text-2xl font-bold text-ink">
          <Users className="h-5 w-5 text-ink-blue" /> Launch Vote
        </h3>
        <StatusBadge tone="live">Admin</StatusBadge>
      </div>

      <div>
        <label htmlFor="vote-title" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/55">
          Resolution title
        </label>
        <input
          id="vote-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-1 w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm outline-none focus:border-ink-blue"
          placeholder="Climate Accord Amendment"
        />
      </div>

      <div>
        <label htmlFor="vote-description" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/55">
          Description
        </label>
        <textarea
          id="vote-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-1 min-h-24 w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm outline-none focus:border-ink-blue"
          placeholder="Add context and voting scope"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="vote-visibility" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/55">
            Ballot visibility
          </label>
          <select
            id="vote-visibility"
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as "public" | "secret")}
            className="mt-1 w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm outline-none focus:border-ink-blue"
          >
            <option value="public">Public</option>
            <option value="secret">Secret</option>
          </select>
        </div>

        <div>
          <label htmlFor="vote-mode" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/55">
            Ballot mode
          </label>
          <select
            id="vote-mode"
            value={ballotMode}
            onChange={(event) => setBallotMode(event.target.value as "per_delegation" | "per_person")}
            className="mt-1 w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm outline-none focus:border-ink-blue"
          >
            <option value="per_delegation">Per delegation</option>
            <option value="per_person">Per person</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="vote-quorum" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/55">
          Quorum requirement ({quorumPercent}%)
        </label>
        <input
          id="vote-quorum"
          type="range"
          min={10}
          max={100}
          step={5}
          value={quorumPercent}
          onChange={(event) => setQuorumPercent(Number(event.target.value))}
          className="mt-2 w-full accent-ink-blue"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/55">Vote options</label>
        <div className="mt-2 space-y-2">
          {options.map((option, index) => (
            <div key={`${index}-${option}`} className="flex items-center gap-2">
              <input
                value={option}
                onChange={(event) => updateOption(index, event.target.value)}
                className="flex-1 rounded-lg border border-ink-border bg-white px-3 py-2 text-sm outline-none focus:border-ink-blue"
              />
              {options.length > 2 ? (
                <button
                  onClick={() => removeOption(index)}
                  className="rounded-lg border border-ink-border bg-white p-2 text-ink/60 transition hover:text-alert-red"
                  title="Remove option"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <button onClick={addOption} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-blue hover:underline">
          <Plus className="h-4 w-4" /> Add option
        </button>
      </div>

      <ActionButton
        onClick={handleCreateVote}
        disabled={isSubmitting || !title.trim() || options.filter((option) => option.trim()).length < 2}
        className="w-full"
      >
        {isSubmitting ? "Launching..." : "Launch vote now"}
      </ActionButton>
    </Panel>
  );
}
