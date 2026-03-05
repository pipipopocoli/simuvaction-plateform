"use client";

import { useState } from "react";
import { Globe } from "lucide-react";

export function LanguageToggle() {
    const [lang, setLang] = useState<"en" | "fr">(() => {
        if (typeof window === "undefined") {
            return "en";
        }
        const saved = localStorage.getItem("language");
        return saved === "fr" ? "fr" : "en";
    });

    const toggleLang = () => {
        const nextLang = lang === "en" ? "fr" : "en";
        setLang(nextLang);
        localStorage.setItem("language", nextLang);

        // In a real app, this might trigger a context update or router refresh
        // For now, it reloads to apply i18n dictionaries if implemented
        window.location.reload();
    };

    return (
        <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 rounded-lg border border-ink-border bg-white/70 dark:bg-slate-800/70 px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm"
            aria-label="Toggle language"
            title="Switch Language (FR/EN)"
        >
            <Globe className="h-3.5 w-3.5 text-ink-blue" />
            <span className="uppercase">{lang}</span>
        </button>
    );
}
