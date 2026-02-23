import { getUserSession } from "@/lib/server-auth";
import { Globe, AlertCircle, FileText, Vote, Video, Plus, Calendar, Megaphone, Flag } from "lucide-react";
import { FrontPageNewsFeed } from "@/components/newsroom/front-page-news-feed";

export default async function FrontPage() {
    const session = await getUserSession();

    return (
        <div className="flex flex-col gap-10 font-sans text-ink">
            {/* 1. HERO SECTION: Map & Breaking News */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Live Briefing / Map (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                    <div className="flex justify-between items-end border-b-2 border-ink pb-2">
                        <h1 className="text-3xl font-serif font-bold tracking-tight">Live Briefing</h1>
                        <span className="text-xs font-medium text-ink/60 uppercase tracking-wider">SimuVaction World Map</span>
                    </div>

                    <div className="relative w-full aspect-video bg-white border border-ink-border rounded-sm shadow-sm flex items-center justify-center overflow-hidden group">
                        {/* Placeholder for actual MapLibre integration */}
                        <div className="absolute inset-0 bg-[#F8F9FA] opacity-50" style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')", backgroundSize: "cover", backgroundPosition: "center" }} />
                        <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />

                        {/* Map Markers (Mock) */}
                        <div className="absolute top-[30%] left-[45%] flex flex-col items-center">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alert-red opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-alert-red border border-white"></span>
                            </span>
                        </div>
                        <div className="absolute top-[40%] left-[20%] flex flex-col items-center">
                            <span className="relative flex h-3 w-3">
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-ink-blue border border-white"></span>
                            </span>
                        </div>

                        {/* Overlays / Pastilles */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            <div className="flex items-center gap-2 bg-white/90 backdrop-blur py-1.5 px-3 border border-alert-red/20 shadow-sm rounded-sm text-xs font-bold text-alert-red uppercase tracking-wider">
                                <span className="h-2 w-2 rounded-full bg-alert-red animate-pulse" /> Vote Open
                            </div>
                            <div className="flex items-center gap-2 bg-white/90 backdrop-blur py-1.5 px-3 border border-ink-border shadow-sm rounded-sm text-xs font-semibold text-ink uppercase tracking-wider">
                                <Calendar className="w-3 h-3 text-ink-blue" /> Dans 45 min
                            </div>
                            <div className="flex items-center gap-2 bg-white/90 backdrop-blur py-1.5 px-3 border border-ink-border shadow-sm rounded-sm text-xs font-semibold text-ink uppercase tracking-wider">
                                <Megaphone className="w-3 h-3 text-ink-blue" /> Press Conf
                            </div>
                        </div>

                        <div className="z-10 bg-white/80 px-4 py-2 border border-ink-border rounded text-sm text-ink/70">
                            Interactive Map Module Loading...
                        </div>
                    </div>
                </div>

                {/* Right: Breaking News Pile (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="flex justify-between items-end border-b border-ink-border pb-2">
                        <h2 className="text-xl font-serif font-semibold text-alert-red flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> Breaking
                        </h2>
                    </div>

                    <div className="flex flex-col gap-px bg-ink-border/50">
                        {/* News Card 1 */}
                        <div className="bg-ivory hover:bg-white transition-colors p-4 group cursor-pointer border-b border-ink-border last:border-0">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-alert-red bg-alert-red/10 px-2 py-0.5 rounded-sm">Urgent</span>
                                <span className="text-[10px] text-ink/50 font-mono">10:42 AM</span>
                            </div>
                            <h3 className="font-serif font-bold text-ink leading-tight mb-2 group-hover:text-ink-blue transition-colors">La Chine annonce une réduction drastique de ses objectifs d'émissions</h3>
                            <p className="text-sm text-ink/70 line-clamp-2">Dans un revirement surprenant lors de l'assemblée ce matin, la délégation a surpris les observateurs en publiant...</p>
                        </div>
                        {/* News Card 2 */}
                        <div className="bg-ivory hover:bg-white transition-colors p-4 group cursor-pointer border-b border-ink-border last:border-0">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-ink bg-ink/5 px-2 py-0.5 rounded-sm">Diplomatie</span>
                                <span className="text-[10px] text-ink/50 font-mono">09:15 AM</span>
                            </div>
                            <h3 className="font-serif font-semibold text-ink leading-tight mb-2 group-hover:text-ink-blue transition-colors">Tensions autour de la résolution sur l'Océan Arctique</h3>
                            <p className="text-sm text-ink/70 line-clamp-2">Les pourparlers bilatéraux entre les blocs occidentaux et nordiques patinent.</p>
                        </div>
                        {/* News Card 3 */}
                        <div className="bg-ivory hover:bg-white transition-colors p-4 group cursor-pointer border-b border-ink-border last:border-0">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-blue bg-ink-blue/10 px-2 py-0.5 rounded-sm">Mise à jour</span>
                                <span className="text-[10px] text-ink/50 font-mono">Hier</span>
                            </div>
                            <h3 className="font-serif font-semibold text-ink leading-tight mb-2 group-hover:text-ink-blue transition-colors">Ouverture officielle de la Session 2026</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. ACTIONS PANEL & UPCOMING EVENTS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Action Buttons */}
                <div className="md:col-span-1 flex flex-col gap-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-ink/60 border-b border-ink-border pb-2 mb-1">Actions Rapides</h3>

                    {session?.role === "leader" || session?.role === "admin" ? (
                        <button className="flex items-center gap-3 w-full bg-ink text-ivory hover:bg-ink-blue transition-colors p-3 rounded-sm shadow-sm text-sm font-medium text-left">
                            <Vote className="w-4 h-4" /> Create Vote / Resolution
                        </button>
                    ) : null}

                    {session?.role === "journalist" ? (
                        <button className="flex items-center gap-3 w-full bg-ink text-ivory hover:bg-ink-blue transition-colors p-3 rounded-sm shadow-sm text-sm font-medium text-left">
                            <FileText className="w-4 h-4" /> Submit News Article
                        </button>
                    ) : null}

                    <button className="flex items-center gap-3 w-full bg-white border border-ink-border hover:border-ink-blue hover:text-ink-blue transition-colors p-3 rounded-sm text-sm font-medium text-left text-ink">
                        <Plus className="w-4 h-4" /> Request Meeting
                    </button>
                    <button className="flex items-center gap-3 w-full bg-white border border-ink-border hover:border-ink-blue hover:text-ink-blue transition-colors p-3 rounded-sm text-sm font-medium text-left text-ink">
                        <Globe className="w-4 h-4" /> Create Private Comms Room
                    </button>
                </div>

                {/* Event Tracker */}
                <div className="md:col-span-2 flex flex-col gap-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-ink/60 border-b border-ink-border pb-2 mb-1">Bandeau d'Événements</h3>
                    <div className="flex overflow-x-auto gap-4 pb-2 snap-x">

                        {/* Event Card */}
                        <div className="min-w-[250px] bg-white border border-ink-border p-4 rounded-sm shadow-sm snap-start flex-shrink-0 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-alert-red" />
                            <div className="flex items-center gap-2 text-xs font-mono text-ink/60 mb-1">
                                <Calendar className="w-3 h-3" /> 11:00 AM
                            </div>
                            <h4 className="font-serif font-semibold text-ink">Clôture des Résolutions</h4>
                            <p className="text-xs text-ink/60 mt-2">Dépôt final des textes.</p>
                        </div>

                        <div className="min-w-[250px] bg-white border border-ink-border p-4 rounded-sm shadow-sm snap-start flex-shrink-0 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-ink-blue" />
                            <div className="flex items-center gap-2 text-xs font-mono text-ink/60 mb-1">
                                <Video className="w-3 h-3" /> 13:00 PM
                            </div>
                            <h4 className="font-serif font-semibold text-ink">Conférence de Presse</h4>
                            <p className="text-xs text-ink/60 mt-2">Délégation Européenne (Lien Zoom)</p>
                        </div>

                        <div className="min-w-[250px] bg-ink/5 border border-ink-border p-4 rounded-sm snap-start flex-shrink-0 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-ink/30" />
                            <div className="flex items-center gap-2 text-xs font-mono text-ink/60 mb-1">
                                <Flag className="w-3 h-3" /> 16:00 PM
                            </div>
                            <h4 className="font-serif font-semibold text-ink">Vote Assemblée Générale</h4>
                            <p className="text-xs text-ink/60 mt-2">Plénière obligatoire.</p>
                        </div>

                    </div>
                </div>
            </div>

            {/* 3. NEWSROOM FEED GRID */}
            <div className="mt-6">
                <FrontPageNewsFeed />
            </div>

        </div>
    );
}

