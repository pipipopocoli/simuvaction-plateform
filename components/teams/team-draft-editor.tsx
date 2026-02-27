"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, PenTool, RefreshCw } from "lucide-react";
import { Panel } from "@/components/ui/commons";

export function TeamDraftEditor() {
    const [draft, setDraft] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDraft = async () => {
            const res = await fetch("/api/teams/draft");
            const data = await res.json();
            if (!data.error) {
                setDraft(data.draft);
            }
            setIsLoading(false);
        };
        fetchDraft();
    }, []);

    const saveDraft = useCallback(async (content: string) => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/teams/draft", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ draft: content })
            });
            if (res.ok) {
                setLastSaved(new Date());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    }, []);

    // Debounced Auto-Save
    useEffect(() => {
        if (isLoading) return;
        const handler = setTimeout(() => {
            saveDraft(draft);
        }, 1500);

        return () => clearTimeout(handler);
    }, [draft, saveDraft, isLoading]);


    return (
        <Panel className="flex flex-col h-full min-h-[500px] border border-ink-border">
            <div className="flex items-center justify-between mb-4 border-b border-ink-border pb-4">
                <div>
                    <h3 className="font-serif text-2xl font-bold flex items-center gap-2 text-ink">
                        <PenTool className="h-5 w-5 text-ink-blue" />
                        Final Declaration Draft
                    </h3>
                    <p className="text-sm text-ink/70">Collaborative notepad for your delegation&apos;s official stance.</p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                    {isSaving ? (
                        <div className="flex items-center gap-1 text-ink/50"><RefreshCw className="h-3 w-3 animate-spin" /> Saving...</div>
                    ) : lastSaved ? (
                        <div className="flex items-center gap-1 text-emerald-600"><CheckCircle className="h-3 w-3" /> Saved {lastSaved.toLocaleTimeString()}</div>
                    ) : null}
                </div>
            </div>

            <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Draft your formal resolution, positions, and operational objectives here. All members of your team share this notepad. It saves automatically..."
                className="flex-1 w-full bg-slate-50/50 resize-none rounded outline-none p-4 font-serif text-lg leading-relaxed text-ink focus:ring-2 focus:ring-ink-blue/20 transition-all border border-transparent focus:border-ink-border"
                disabled={isLoading}
            />
        </Panel>
    )
}
