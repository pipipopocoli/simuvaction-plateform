"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("theme");
        if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            document.documentElement.classList.add("dark");
            setDark(true);
        }
    }, []);

    const toggle = () => {
        const next = !dark;
        setDark(next);
        if (next) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    return (
        <button
            onClick={toggle}
            className="flex items-center gap-1.5 rounded-lg border border-ink-border bg-white/70 dark:bg-slate-800/70 px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm"
            aria-label="Toggle dark mode"
        >
            {dark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-slate-500" />}
            {dark ? "Light" : "Dark"}
        </button>
    );
}
