"use client";

import { useMemo, useState } from "react";
import {
  Filter,
  Globe2,
  MessageSquare,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  ActionButton,
  MapOverlayChip,
  Panel,
  PageShell,
  SectionHeader,
  TimelineItem,
} from "@/components/ui/commons";

type AtlasCountry = {
  id: string;
  name: string;
  region: string;
  status: "active" | "watch";
  stance: string;
  priorities: string[];
};

const COUNTRIES: AtlasCountry[] = [
  {
    id: "fr",
    name: "France",
    region: "Europe",
    status: "active",
    stance: "Supports climate enforcement with measurable sovereignty protections.",
    priorities: ["Arctic governance", "Joint financing", "Cyber diplomacy"],
  },
  {
    id: "br",
    name: "Brazil",
    region: "Americas",
    status: "active",
    stance: "Requires adaptation funding and technology transfer guarantees.",
    priorities: ["Green fund", "Food security", "Rainforest safeguards"],
  },
  {
    id: "cn",
    name: "China",
    region: "Asia",
    status: "watch",
    stance: "Negotiates stronger industrial transition windows and trade protections.",
    priorities: ["Energy transition", "Trade stability", "Supply chain governance"],
  },
  {
    id: "ke",
    name: "Kenya",
    region: "Africa",
    status: "active",
    stance: "Pushes for adaptation financing and climate resilience programs.",
    priorities: ["Water security", "Disaster response", "Regional coordination"],
  },
];

export default function AtlasPage() {
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<AtlasCountry>(COUNTRIES[0]);
  const [showAlliances, setShowAlliances] = useState(true);
  const [showVotes, setShowVotes] = useState(true);

  const filteredCountries = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return COUNTRIES;
    }

    return COUNTRIES.filter((country) => country.name.toLowerCase().includes(normalized));
  }, [search]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Geopolitical Monitor"
        title="Atlas"
        subtitle="Track delegation posture, alliances, and negotiation pressure in real time."
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
            {filteredCountries.map((country) => {
              const selected = selectedCountry.id === country.id;
              return (
                <button
                  key={country.id}
                  onClick={() => setSelectedCountry(country)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                    selected
                      ? "border-ink-blue bg-blue-50"
                      : "border-transparent bg-white hover:border-ink-border"
                  }`}
                >
                  <p className="text-sm font-semibold text-ink">{country.name}</p>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-ink/55">{country.region}</p>
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

            <div className="absolute left-[48%] top-[32%]">
              <span className="relative flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ink-blue/60" />
                <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-ink-blue" />
              </span>
            </div>

            <div className="absolute left-[30%] top-[45%]">
              <span className="relative flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
                <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
              </span>
            </div>

            <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-ink-border bg-white/92 p-4 shadow-sm backdrop-blur">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Regional signal</p>
              <p className="mt-1 text-sm text-ink/80">
                Diplomatic activity is highest across Europe and the Americas with sustained bilateral coordination.
              </p>
            </div>
          </div>
        </PageShell>

        <Panel className="xl:col-span-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Delegation Profile</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-ink">{selectedCountry.name}</h2>
          <p className="mt-1 text-sm text-ink/60">{selectedCountry.region} delegation</p>

          <div className="mt-4 rounded-xl border border-ink-border bg-ivory p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Official stance</p>
            <p className="mt-2 text-sm text-ink/80">{selectedCountry.stance}</p>
          </div>

          <div className="mt-4 rounded-xl border border-ink-border bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Priority tracks</p>
            <ul className="mt-2 space-y-1.5 text-sm text-ink/80">
              {selectedCountry.priorities.map((priority) => (
                <li key={priority} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-ink-blue" />
                  {priority}
                </li>
              ))}
            </ul>
          </div>

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
            <TimelineItem time="10:45 UTC" title="Vote cast on climate package" tone="accent" />
            <TimelineItem time="09:10 UTC" title="Statement submitted" />
            <TimelineItem time="Yesterday" title="Bilateral consultation opened" tone="alert" />
          </div>
        </Panel>
      </div>
    </div>
  );
}
