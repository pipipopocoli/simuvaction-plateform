"use client";

import { useMemo, useState } from "react";
import {
  Filter,
  Globe2,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { AtlasDelegation } from "@/lib/atlas";
import {
  ActionButton,
  MapOverlayChip,
  Panel,
  PageShell,
  SectionHeader,
  StatusBadge,
  TimelineItem,
} from "@/components/ui/commons";

export function AtlasClient({ delegations }: { delegations: AtlasDelegation[] }) {
  const [search, setSearch] = useState("");
  const [showAlliances, setShowAlliances] = useState(true);
  const [showVotes, setShowVotes] = useState(true);
  const [selectedId, setSelectedId] = useState(delegations[0]?.id ?? "");

  const filteredDelegations = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return delegations;
    }

    return delegations.filter((delegation) => delegation.name.toLowerCase().includes(normalized));
  }, [delegations, search]);

  const selectedDelegation = useMemo(() => {
    return (
      delegations.find((delegation) => delegation.id === selectedId) ??
      filteredDelegations[0] ??
      delegations[0]
    );
  }, [delegations, filteredDelegations, selectedId]);

  const countryPins = useMemo(
    () => delegations.filter((delegation) => delegation.kind === "country" && delegation.mapPoint),
    [delegations],
  );

  if (delegations.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Geopolitical Monitor"
          title="Atlas"
          subtitle="No delegation has been seeded for the active event yet."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Geopolitical Monitor"
        title="Atlas"
        subtitle="All delegations from this event are listed; only country delegations are geo-pinned."
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <Panel className="xl:col-span-3">
          <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-ink">
            <Filter className="h-5 w-5 text-ink-blue" /> Filters
          </h2>

          <label className="mt-4 flex items-center gap-2 rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink/65">
            <Search className="h-4 w-4" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find a delegation"
              className="w-full bg-transparent text-ink outline-none placeholder:text-ink/40"
            />
          </label>

          <div className="mt-4 space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showAlliances}
                onChange={(event) => setShowAlliances(event.target.checked)}
                className="h-4 w-4 accent-ink-blue"
              />
              Show alliance arcs
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showVotes}
                onChange={(event) => setShowVotes(event.target.checked)}
                className="h-4 w-4 accent-ink-blue"
              />
              Show active voting heat
            </label>
          </div>

          <div className="mt-5 space-y-2 border-t border-ink-border pt-4">
            {filteredDelegations.map((delegation) => {
              const selected = selectedDelegation?.id === delegation.id;
              return (
                <button
                  key={delegation.id}
                  onClick={() => setSelectedId(delegation.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                    selected
                      ? "border-ink-blue bg-blue-50"
                      : "border-transparent bg-white hover:border-ink-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">{delegation.name}</p>
                    <StatusBadge tone={delegation.kind === "country" ? "live" : "neutral"}>
                      {delegation.kind}
                    </StatusBadge>
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-ink/55">
                    {delegation.region} • {delegation.memberCount} members
                  </p>
                </button>
              );
            })}
          </div>
        </Panel>

        <PageShell className="xl:col-span-6">
          <div className="relative min-h-[640px] overflow-hidden rounded-2xl border border-ink-border bg-[#eaf0fa]">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-70"
              style={{
                backgroundImage:
                  "url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/35" />

            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <MapOverlayChip tone="accent" icon={<Globe2 className="h-3.5 w-3.5" />} label="Global projection" />
              {showAlliances ? <MapOverlayChip label="Alliance paths visible" /> : null}
              {showVotes ? <MapOverlayChip tone="alert" label="Voting pressure overlay" /> : null}
            </div>

            {countryPins.map((delegation) => {
              const isSelected = delegation.id === selectedDelegation?.id;
              return (
                <button
                  key={delegation.id}
                  type="button"
                  onClick={() => setSelectedId(delegation.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${delegation.mapPoint?.xPct}%`, top: `${delegation.mapPoint?.yPct}%` }}
                  title={delegation.name}
                >
                  <span className="relative flex h-4 w-4">
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full ${
                        isSelected ? "animate-ping bg-ink-blue/70" : "bg-emerald-500/40"
                      }`}
                    />
                    <span
                      className={`relative inline-flex h-4 w-4 rounded-full border-2 border-white ${
                        isSelected ? "bg-ink-blue" : "bg-emerald-500"
                      }`}
                    />
                  </span>
                </button>
              );
            })}

            <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-ink-border bg-white/92 p-4 shadow-sm backdrop-blur">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Coverage statement</p>
              <p className="mt-1 text-sm text-ink/80">
                Every delegation in the active event is listed in Atlas. Geographic pins are shown only for country delegations.
              </p>
            </div>
          </div>
        </PageShell>

        {selectedDelegation ? (
          <Panel className="xl:col-span-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Delegation profile</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-ink">{selectedDelegation.name}</h2>
            <p className="mt-1 text-sm text-ink/60">{selectedDelegation.region}</p>

            <div className="mt-3 flex items-center gap-2">
              <StatusBadge tone={selectedDelegation.status === "active" ? "live" : "neutral"}>
                {selectedDelegation.status}
              </StatusBadge>
              <StatusBadge tone={selectedDelegation.kind === "country" ? "live" : "neutral"}>
                {selectedDelegation.kind === "country" ? "Country delegation" : "Global actor"}
              </StatusBadge>
            </div>

            <div className="mt-4 rounded-xl border border-ink-border bg-ivory p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Official stance</p>
              <p className="mt-2 text-sm text-ink/80">{selectedDelegation.stance}</p>
            </div>

            <div className="mt-4 rounded-xl border border-ink-border bg-white p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Priority tracks</p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink/80">
                {selectedDelegation.priorities.map((priority) => (
                  <li key={priority} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-ink-blue" />
                    {priority}
                  </li>
                ))}
              </ul>
            </div>

            {selectedDelegation.kind === "actor" ? (
              <p className="mt-4 rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink/70">
                This is a global actor profile with no geographic pin.
              </p>
            ) : !selectedDelegation.mapPoint ? (
              <p className="mt-4 rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink/70">
                No geographic pin configured yet for this country delegation.
              </p>
            ) : null}

            <div className="mt-4 grid gap-2">
              <ActionButton className="w-full justify-between">
                Request meeting
                <MessageSquare className="h-4 w-4" />
              </ActionButton>
              <ActionButton variant="secondary" className="w-full justify-between">
                Open delegation thread
                <Users className="h-4 w-4" />
              </ActionButton>
            </div>

            <div className="mt-6 space-y-3 border-t border-ink-border pt-4">
              <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">
                <ShieldCheck className="h-3.5 w-3.5" /> Activity timeline
              </h3>
              <TimelineItem time="10:45 UTC" title="Vote signal captured" tone="accent" />
              <TimelineItem time="09:10 UTC" title="Position update recorded" />
              <TimelineItem time="Yesterday" title="Bilateral channel activated" tone="alert" />
            </div>
          </Panel>
        ) : (
          <Panel className="xl:col-span-3">
            <p className="text-sm text-ink/65">No delegation selected.</p>
          </Panel>
        )}
      </div>

      <p className="text-xs text-ink/60">
        <MapPin className="mr-1 inline h-3.5 w-3.5" />
        All delegations from this event are listed; only country delegations are geo-pinned.
      </p>
    </div>
  );
}
