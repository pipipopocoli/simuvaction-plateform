"use client";

import { useState, useEffect } from "react";
import { MapPin, Info } from "lucide-react";

type MapNode = {
    id: string;
    countryCode: string;
    countryName: string;
    stanceShort: string | null;
    stanceLong: string | null;
    priorities: string[];
    x: number;
    y: number;
};

// Extremely rough plotting heuristics for SimuVaction's world map box.
// Realistically, x/y coords would be fetched from the DB or a static JSON,
// but we will hardcode a few estimations for demonstration based on a 100x100 grid.
const getPlotCoords = (code: string) => {
    const coords: Record<string, { x: number; y: number }> = {
        'US': { x: 22, y: 35 },
        'CA': { x: 20, y: 25 },
        'GB': { x: 47, y: 28 },
        'FR': { x: 48, y: 33 },
        'DE': { x: 50, y: 31 },
        'IT': { x: 51, y: 37 },
        'RU': { x: 70, y: 25 },
        'CN': { x: 78, y: 40 },
        'JP': { x: 88, y: 38 },
        'IN': { x: 70, y: 48 },
        'BR': { x: 33, y: 65 },
        'ZA': { x: 53, y: 75 },
        'NG': { x: 48, y: 55 },
        'SA': { x: 60, y: 45 },
        'AU': { x: 85, y: 78 }
    };
    return coords[code] || { x: 50, y: 50 }; // Default to center if unknown
};

export function InteractiveGlobalMap({ teams }: { teams: any[] }) {
    const [selectedTeam, setSelectedTeam] = useState<MapNode | null>(null);
    const [mapNodes, setMapNodes] = useState<MapNode[]>([]);

    useEffect(() => {
        const nodes = teams.map(t => ({
            ...t,
            ...getPlotCoords(t.countryCode)
        }));
        setMapNodes(nodes);
    }, [teams]);

    return (
        <div className="relative w-full h-[400px] bg-slate-100 rounded-2xl overflow-hidden border border-ink-border">
            {/* Base SVG Map Layer */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-75 pointer-events-none"
                style={{
                    backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')",
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#f9fbff]/65 via-white/35 to-[#f8f3ec]/65 pointer-events-none" />

            {/* Plot Points Layer */}
            {mapNodes.map((node) => (
                <button
                    key={node.id}
                    onClick={() => setSelectedTeam(node)}
                    className="absolute group transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                    <div className={`relative flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 shadow-sm
                        ${selectedTeam?.id === node.id
                            ? 'bg-alert-red scale-125 z-20 shadow-alert-red/40 string'
                            : 'bg-ink-blue hover:bg-ink hover:scale-110 z-10'}`}
                    >
                        <span className="text-[10px] leading-none" dangerouslySetInnerHTML={{ __html: `&#x1F1${node.countryCode.charCodeAt(0) - 65 + 166};&#x1F1${node.countryCode.charCodeAt(1) - 65 + 166};` }} />
                    </div>
                </button>
            ))}

            {/* Country Profile Overlay (Renders when a node is clicked) */}
            {selectedTeam && (
                <div className="absolute bottom-4 right-4 max-w-sm bg-white/95 backdrop-blur-sm border border-ink-border rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200 z-30">
                    <div className="bg-ink-blue text-white px-4 py-3 flex items-center justify-between">
                        <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                            <span className="text-xl leading-none" dangerouslySetInnerHTML={{ __html: `&#x1F1${selectedTeam.countryCode.charCodeAt(0) - 65 + 166};&#x1F1${selectedTeam.countryCode.charCodeAt(1) - 65 + 166};` }} />
                            {selectedTeam.countryName}
                        </h3>
                        <button onClick={() => setSelectedTeam(null)} className="text-white/70 hover:text-white transition">✖</button>
                    </div>

                    <div className="p-4 space-y-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-ink/50 mb-1">Public Stance</p>
                            <p className="text-sm text-ink leading-relaxed font-semibold">
                                {selectedTeam.stanceShort || <span className="italic text-ink/40">No public stance declared yet.</span>}
                            </p>
                        </div>

                        {selectedTeam.priorities && selectedTeam.priorities.length > 0 && (
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-ink/50 mb-1">Stated Priorities</p>
                                <div className="flex flex-wrap gap-1">
                                    {selectedTeam.priorities.map((p, i) => (
                                        <span key={i} className="bg-slate-100 text-ink text-xs px-2 py-1 rounded-md border border-ink-border">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button className="w-full mt-2 py-2 text-xs font-bold uppercase tracking-widest text-ink-blue border border-ink-blue/30 rounded hover:bg-ink-blue/5 transition">
                            Request Bilateral
                        </button>
                    </div>
                </div>
            )}

            {/* Helpful legend when nothing is clicked */}
            {!selectedTeam && (
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-ink-border rounded-lg p-3 max-w-xs shadow-sm flex items-start gap-3">
                    <Info className="h-5 w-5 text-ink-blue shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-ink uppercase tracking-wider mb-1">Interactive Operations Map</p>
                        <p className="text-[11px] text-ink/70 leading-relaxed">Click on any delegation marker on the map to review their public stance, intelligence brief, and request bilateral meetings.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
