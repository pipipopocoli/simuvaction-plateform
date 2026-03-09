"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";
import { FileText, Globe2, Loader2, Lock, UploadCloud } from "lucide-react";

type EventDocument = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  type: string;
  fileName: string | null;
  mimeType: string | null;
  isPublic: boolean;
  createdAt: string;
  createdBy: { name: string; displayRole: string | null; role: string };
  publicAuthorName: string;
  targetTeams?: { id: string; countryCode: string; countryName: string }[];
};

type TeamLibraryItem = {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  fileName: string | null;
  createdAt: string;
  team: { id: string; countryCode: string; countryName: string };
  createdBy: { id: string; name: string; role: string };
};

type TeamOption = {
  id: string;
  countryCode: string;
  countryName: string;
};

function formatDate(iso: string) {
  return DateTime.fromISO(iso).toFormat("dd LLL yyyy, HH:mm");
}

export function DocumentLibrary({
  isAdmin,
  teamId,
}: {
  isAdmin: boolean;
  teamId: string | null;
}) {
  const [officialDocuments, setOfficialDocuments] = useState<EventDocument[]>([]);
  const [teamItems, setTeamItems] = useState<TeamLibraryItem[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [selectedOfficialTeams, setSelectedOfficialTeams] = useState<string[]>([]);
  const [selectedTeamLibraryId, setSelectedTeamLibraryId] = useState(teamId ?? "");
  const [officialTitle, setOfficialTitle] = useState("");
  const [officialDescription, setOfficialDescription] = useState("");
  const [officialIsPublic, setOfficialIsPublic] = useState(true);
  const [teamTitle, setTeamTitle] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingOfficial, setIsUploadingOfficial] = useState(false);
  const [isUploadingTeam, setIsUploadingTeam] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const officialInputRef = useRef<HTMLInputElement | null>(null);
  const teamInputRef = useRef<HTMLInputElement | null>(null);

  const effectiveTeamLibraryId = isAdmin ? selectedTeamLibraryId : teamId;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [officialResponse, teamsResponse, teamLibraryResponse] = await Promise.all([
        fetch("/api/documents", { cache: "no-store" }),
        fetch("/api/teams", { cache: "no-store" }),
        fetch(
          effectiveTeamLibraryId
            ? `/api/team-library/items?teamId=${effectiveTeamLibraryId}`
            : "/api/team-library/items",
          { cache: "no-store" },
        ),
      ]);

      if (officialResponse.ok) {
        setOfficialDocuments(await officialResponse.json());
      }
      if (teamsResponse.ok) {
        setTeams(await teamsResponse.json());
      }
      if (teamLibraryResponse.ok) {
        setTeamItems(await teamLibraryResponse.json());
      }
    } finally {
      setIsLoading(false);
    }
  }, [effectiveTeamLibraryId]);

  useEffect(() => {
    void load();
  }, [load]);

  const groupedTeamItems = useMemo(() => {
    const grouped = new Map<string, TeamLibraryItem[]>();
    for (const item of teamItems) {
      const current = grouped.get(item.team.countryName) ?? [];
      current.push(item);
      grouped.set(item.team.countryName, current);
    }
    return Array.from(grouped.entries());
  }, [teamItems]);

  async function uploadOfficial(file: File) {
    setError(null);
    setIsUploadingOfficial(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", officialTitle || file.name);
      formData.append("description", officialDescription);
      formData.append("type", file.type || "file");
      formData.append("isPublic", String(officialIsPublic));
      selectedOfficialTeams.forEach((id) => formData.append("targetTeamIds", id));

      const response = await fetch("/api/admin/documents", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to upload this official document.");
      }
      setOfficialTitle("");
      setOfficialDescription("");
      setSelectedOfficialTeams([]);
      await load();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload this official document.");
    } finally {
      setIsUploadingOfficial(false);
    }
  }

  async function uploadTeamItem(file: File) {
    if (!effectiveTeamLibraryId) {
      setError("Choose a target team library first.");
      return;
    }
    setError(null);
    setIsUploadingTeam(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("teamId", effectiveTeamLibraryId);
      formData.append("title", teamTitle || file.name);
      formData.append("description", teamDescription);
      formData.append("fileType", file.type || "file");

      const response = await fetch("/api/team-library/items", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to upload this team document.");
      }
      setTeamTitle("");
      setTeamDescription("");
      await load();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload this team document.");
    } finally {
      setIsUploadingTeam(false);
    }
  }

  return (
    <div className="space-y-8">
      {error ? <p className="rounded-xl border border-alert-red/30 bg-alert-red/10 px-4 py-3 text-sm text-alert-red">{error}</p> : null}

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-ink-border bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl font-bold text-ink">Official library</h2>
          <p className="mt-2 text-sm text-ink/65">
            Official documents can be public to the full event or restricted to selected teams.
          </p>

          {isAdmin ? (
            <div className="mt-5 space-y-4">
              <input
                value={officialTitle}
                onChange={(event) => setOfficialTitle(event.target.value)}
                placeholder="Title"
                className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
              />
              <textarea
                value={officialDescription}
                onChange={(event) => setOfficialDescription(event.target.value)}
                placeholder="Description"
                className="min-h-[96px] w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
              />

              <label className="flex items-center gap-2 text-sm text-ink/75">
                <input
                  type="checkbox"
                  checked={officialIsPublic}
                  onChange={(event) => setOfficialIsPublic(event.target.checked)}
                />
                Visible to all teams
              </label>

              {!officialIsPublic ? (
                <div className="grid max-h-44 gap-2 overflow-y-auto rounded-xl border border-ink-border bg-ivory p-3">
                  {teams.map((team) => (
                    <label key={team.id} className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={selectedOfficialTeams.includes(team.id)}
                        onChange={(event) =>
                          setSelectedOfficialTeams((current) =>
                            event.target.checked
                              ? [...current, team.id]
                              : current.filter((value) => value !== team.id),
                          )
                        }
                      />
                      {team.countryName}
                    </label>
                  ))}
                </div>
              ) : null}

              <input
                ref={officialInputRef}
                type="file"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void uploadOfficial(file);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => officialInputRef.current?.click()}
                disabled={isUploadingOfficial}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink-blue/50 bg-blue-50 px-4 py-6 text-sm font-semibold text-ink-blue disabled:opacity-60"
              >
                {isUploadingOfficial ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Upload official document
              </button>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex min-h-[180px] items-center justify-center rounded-2xl border border-ink-border bg-white text-sm text-ink/55">
              Loading official documents...
            </div>
          ) : officialDocuments.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-ink-border bg-white p-8 text-center text-sm text-ink/55">
              No official document is available for your access scope yet.
            </div>
          ) : (
            officialDocuments.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col rounded-2xl border border-ink-border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-ink-blue/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-xl bg-ivory p-3 text-ink-blue">
                    <FileText className="h-6 w-6" />
                  </div>
                  {doc.isPublic ? <Globe2 className="h-4 w-4 text-ink/35" /> : <Lock className="h-4 w-4 text-alert-red" />}
                </div>
                <h3 className="mt-4 font-serif text-xl font-bold text-ink group-hover:text-ink-blue">{doc.title}</h3>
                {doc.description ? <p className="mt-2 text-sm text-ink/70">{doc.description}</p> : null}
                <div className="mt-auto pt-4 text-xs text-ink/55">
                  <p>{formatDate(doc.createdAt)} · {doc.publicAuthorName}</p>
                  {!doc.isPublic && doc.targetTeams?.length ? (
                    <p className="mt-1">Restricted to: {doc.targetTeams.map((team) => team.countryName).join(", ")}</p>
                  ) : null}
                </div>
              </a>
            ))
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-ink-border bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl font-bold text-ink">Team private library</h2>
          <p className="mt-2 text-sm text-ink/65">
            Documents uploaded here are visible only to the owning team and admins.
          </p>

          <div className="mt-5 space-y-4">
            {isAdmin ? (
              <select
                value={selectedTeamLibraryId}
                onChange={(event) => setSelectedTeamLibraryId(event.target.value)}
                className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
              >
                <option value="">Select a team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.countryName}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-lg border border-ink-border bg-ivory px-3 py-2 text-sm text-ink/75">
                Upload target: your team library
              </div>
            )}

            <input
              value={teamTitle}
              onChange={(event) => setTeamTitle(event.target.value)}
              placeholder="Title"
              className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
            />
            <textarea
              value={teamDescription}
              onChange={(event) => setTeamDescription(event.target.value)}
              placeholder="Description"
              className="min-h-[96px] w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink outline-none"
            />
            <input
              ref={teamInputRef}
              type="file"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void uploadTeamItem(file);
                }
              }}
            />
            <button
              type="button"
              onClick={() => teamInputRef.current?.click()}
              disabled={isUploadingTeam || !effectiveTeamLibraryId}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink-blue/50 bg-blue-50 px-4 py-6 text-sm font-semibold text-ink-blue disabled:opacity-60"
            >
              {isUploadingTeam ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              Upload team document
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {isLoading ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-ink-border bg-white text-sm text-ink/55">
              Loading team library...
            </div>
          ) : groupedTeamItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-border bg-white p-8 text-center text-sm text-ink/55">
              No private team document is available for the selected scope yet.
            </div>
          ) : (
            groupedTeamItems.map(([teamName, items]) => (
              <div key={teamName} className="rounded-2xl border border-ink-border bg-white p-5 shadow-sm">
                <h3 className="font-serif text-xl font-bold text-ink">{teamName}</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <a
                      key={item.id}
                      href={item.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-ink-border bg-ivory p-4 transition hover:border-ink-blue/40"
                    >
                      <p className="font-semibold text-ink">{item.title}</p>
                      {item.description ? <p className="mt-1 text-sm text-ink/70">{item.description}</p> : null}
                      <p className="mt-3 text-xs text-ink/55">
                        {formatDate(item.createdAt)} · {item.createdBy.name}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
