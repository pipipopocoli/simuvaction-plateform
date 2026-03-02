import { SocialFeed } from "@/components/x/social-feed";
import { MessageCircle, Search, TrendingUp, Users } from "lucide-react";

export default function XTrackerPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-12 h-[calc(100vh-8rem)]">
      {/* Main Feed Column */}
      <div className="lg:col-span-8 flex flex-col min-h-0">
        <SocialFeed limit={100} allowPosting={true} />
      </div>

      {/* Sidebar Analytics */}
      <div className="lg:col-span-4 space-y-4">
        <div className="rounded-xl border border-ink-border bg-white p-5 shadow-sm">
          <h3 className="font-serif text-xl font-bold text-ink">Global Trends</h3>
          <ul className="mt-4 space-y-4">
            <li className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase">Trending Worldwide</p>
                <p className="font-bold text-ink hover:text-blue-600 cursor-pointer">#SimuVaction26</p>
                <p className="text-xs text-zinc-400">140 Posts</p>
              </div>
            </li>
            <li className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase">Diplomacy</p>
                <p className="font-bold text-ink hover:text-blue-600 cursor-pointer">Security Council</p>
                <p className="text-xs text-zinc-400">85 Posts</p>
              </div>
            </li>
            <li className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase">Trending in Africa</p>
                <p className="font-bold text-ink hover:text-blue-600 cursor-pointer">#ClimateAccord</p>
                <p className="text-xs text-zinc-400">54 Posts</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-ink-border bg-white p-5 shadow-sm">
          <h3 className="font-serif text-xl font-bold text-ink">Implementation Checklist</h3>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-zinc-700">
            <li>Capture official account handle and profile metadata.</li>
            <li>Store and validate post links for traceability.</li>
            <li>Track minimum cadence target: 2 posts per week.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
