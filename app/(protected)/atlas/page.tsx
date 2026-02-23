"use client";

import { useState } from "react";
import { Search, Map as MapIcon, Flag, Users, Clock, ArrowRight, MessageSquare, Filter } from "lucide-react";

// Mock Data
const MOCK_COUNTRIES = [
    { id: "fr", name: "France", region: "Europe", active: true },
    { id: "br", name: "Brésil", region: "Amériques", active: true },
    { id: "cn", name: "Chine", region: "Asie", active: false },
    { id: "us", name: "États-Unis", region: "Amériques", active: true },
];

export default function AtlasPage() {
    const [search, setSearch] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("fr");

    // Toggles
    const [showAlliances, setShowAlliances] = useState(false);
    const [showVotes, setShowVotes] = useState(true);

    const filteredCountries = MOCK_COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="h-[calc(100vh-8rem)] flex overflow-hidden border border-ink-border rounded-sm bg-ivory font-sans text-ink">

            {/* LEFT SIDEBAR: Filters & Country List */}
            <div className="w-80 flex-shrink-0 border-r border-ink-border flex flex-col bg-[#FFFBF5]">
                <div className="p-4 border-b border-ink-border">
                    <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
                        <Filter className="w-4 h-4 text-ink-blue" /> Atlas Navigator
                    </h2>

                    <div className="relative mb-4">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink/50" />
                        <input
                            className="w-full bg-white border border-ink-border rounded-sm pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-ink-blue transition-colors placeholder:text-ink/40"
                            placeholder="Rechercher une délégation..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm cursor-pointer group">
                            <input type="checkbox" checked={showAlliances} onChange={(e) => setShowAlliances(e.target.checked)} className="accent-ink-blue w-4 h-4 border-ink-border" />
                            <span className="group-hover:text-ink-blue transition-colors">Afficher les alliances géopolitiques</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer group">
                            <input type="checkbox" checked={showVotes} onChange={(e) => setShowVotes(e.target.checked)} className="accent-ink-blue w-4 h-4 border-ink-border" />
                            <span className="group-hover:text-ink-blue transition-colors">Afficher l'activité de vote (Live)</span>
                        </label>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink/50 mb-3">Délégations Actives</h3>
                    {filteredCountries.map(country => (
                        <button
                            key={country.id}
                            onClick={() => setSelectedCountry(country.id)}
                            className={`w-full flex flex-col items-start p-3 text-sm rounded-sm transition-colors border ${selectedCountry === country.id ? 'bg-ink-blue/5 border-ink-blue text-ink-blue' : 'bg-transparent border-transparent hover:bg-white hover:border-ink-border text-ink'}`}
                        >
                            <span className="font-semibold">{country.name}</span>
                            <span className="text-[10px] uppercase tracking-wider opacity-70">{country.region}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* CENTER: Main Map Area */}
            <div className="flex-1 relative bg-[#F8F9FA] flex flex-col shadow-inner">
                {/* Simulated Map Background */}
                <div className="absolute inset-0 opacity-40 mix-blend-multiply" style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')", backgroundSize: "cover", backgroundPosition: "center" }} />

                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur border border-ink-border rounded-sm px-4 py-2 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink">
                        <MapIcon className="w-4 h-4 text-ink-blue" /> Projection Globale
                    </div>
                </div>

                {/* Simulated Map Interactive Element (Brazil selected) */}
                {selectedCountry === "br" && (
                    <div className="absolute top-[45%] left-[30%] flex flex-col items-center group cursor-pointer">
                        <span className="relative flex h-5 w-5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ink-blue opacity-30"></span>
                            <span className="relative inline-flex rounded-full h-5 w-5 bg-ink-blue border-2 border-white shadow-md"></span>
                        </span>
                        <div className="mt-2 bg-white px-2 py-1 text-xs font-bold border border-ink-border rounded-sm shadow-sm text-ink group-hover:-translate-y-1 transition-transform">
                            BRÉSIL
                        </div>
                    </div>
                )}
                {selectedCountry === "fr" && (
                    <div className="absolute top-[30%] left-[48%] flex flex-col items-center group cursor-pointer">
                        <span className="relative flex h-5 w-5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ink-blue opacity-30"></span>
                            <span className="relative inline-flex rounded-full h-5 w-5 bg-ink-blue border-2 border-white shadow-md"></span>
                        </span>
                        <div className="mt-2 bg-white px-2 py-1 text-xs font-bold border border-ink-border rounded-sm shadow-sm text-ink group-hover:-translate-y-1 transition-transform">
                            FRANCE
                        </div>
                    </div>
                )}

                <div className="absolute bottom-4 left-4 max-w-sm bg-white/95 backdrop-blur border border-ink-border p-4 rounded-sm shadow-md">
                    <h4 className="font-serif font-bold text-sm mb-1">Activité Récente</h4>
                    <p className="text-xs text-ink/70">La zone Amériques connaît une forte activité diplomatique bilatérale suite à la résolution 4.</p>
                </div>
            </div>

            {/* RIGHT SIDEBAR: Country Profile */}
            <div className="w-[400px] flex-shrink-0 border-l border-ink-border bg-white flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">

                {/* Header Profile */}
                <div className="p-6 border-b border-ink-border bg-ivory">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-8 bg-zinc-200 border border-ink-border flex items-center justify-center text-xs text-ink/50 uppercase">
                            Flag
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-alert-red bg-alert-red/5 px-2 py-1 border border-alert-red/10 rounded-sm">En Négociation</span>
                    </div>
                    <h2 className="text-2xl font-serif font-extrabold text-ink leading-none mb-1">
                        {selectedCountry === 'br' ? "République Fédérative du Brésil" : "République Française"}
                    </h2>
                    <p className="text-sm font-medium text-ink/60 uppercase tracking-widest">Délégation Officielle</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Stance Abstract */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50 border-b border-ink-border pb-1 mb-3">Position Officielle</h3>
                        <p className="font-serif text-ink/90 leading-relaxed text-sm">
                            La délégation soutient fermement une approche multilatérale pour réduire les émissions globales tout en garantissant un fonds souverain d'adaptation pour les nations en développement. Le compromis technologique est inacceptable sans transferts de brevets.
                        </p>
                    </div>

                    {/* Priorities & Team */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50 border-b border-ink-border pb-1 mb-3">Priorités</h3>
                            <ul className="text-sm space-y-2 list-square list-inside text-ink/80 marker:text-ink-blue">
                                <li>Fonds d'Adaptation</li>
                                <li>Transfert Technologique</li>
                                <li>Souveraineté Amazonienne</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50 border-b border-ink-border pb-1 mb-3">Équipe</h3>
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-ink/10 border-2 border-white flex items-center justify-center text-ink/40">
                                        <Users className="w-4 h-4" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex gap-3">
                        <button className="flex-1 bg-ink text-ivory hover:bg-ink-blue transition-colors py-2 px-4 flex justify-center items-center gap-2 text-sm font-semibold rounded-sm shadow-sm">
                            <MessageSquare className="w-4 h-4" /> Request Meeting
                        </button>
                    </div>

                </div>

                {/* Timeline / Intel Bottom */}
                <div className="border-t border-ink-border bg-ivory p-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-4 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Historique d'Activité
                    </h3>
                    <div className="space-y-4">
                        <div className="relative pl-4 border-l-2 border-ink-border">
                            <div className="absolute w-2 h-2 rounded-full bg-ink-blue -left-[5px] top-1" />
                            <p className="text-xs font-semibold text-ink">A voté POUR la résolution Climat.</p>
                            <span className="text-[10px] text-ink/50 font-mono">10:45 AM</span>
                        </div>
                        <div className="relative pl-4 border-l-2 border-ink-border">
                            <div className="absolute w-2 h-2 rounded-full bg-ink-border -left-[5px] top-1" />
                            <p className="text-xs font-semibold text-ink">Communiqué de presse émis.</p>
                            <span className="text-[10px] text-ink/50 font-mono">Hier, 15:30 PM</span>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}
