"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, CheckCircle, User2, PenLine } from "lucide-react";
import { Panel } from "@/components/ui/commons";

export function ProfileEditor() {
    const [name, setName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch("/api/profile").then(r => r.json()).then(data => {
            if (!data.error) {
                setName(data.name || "");
                setAvatarUrl(data.avatarUrl || null);
            }
        });
    }, []);

    const handleFileUpload = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setAvatarUrl(dataUrl);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
    };

    const save = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, avatarUrl }),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Panel>
            <h3 className="font-serif text-xl font-bold text-ink mb-4 flex items-center gap-2">
                <User2 className="h-5 w-5 text-ink-blue" /> Edit Profile
            </h3>

            {/* Avatar drop zone */}
            <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative mx-auto mb-4 h-24 w-24 cursor-pointer rounded-full border-2 border-dashed transition-all flex items-center justify-center overflow-hidden
          ${isDragging ? "border-ink-blue bg-ink-blue/10 scale-110" : "border-ink-border hover:border-ink-blue/50"}`}
            >
                {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center gap-1 text-ink/40">
                        <Upload className="h-6 w-6" />
                        <span className="text-[10px] text-center leading-tight">Drop photo<br />or click</span>
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                />
            </div>

            {/* Name input */}
            <div className="mb-4">
                <label className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-1 block">Display Name</label>
                <div className="flex items-center gap-2 rounded-lg border border-ink-border bg-white px-3 py-2">
                    <PenLine className="h-4 w-4 text-ink/30" />
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-ink outline-none"
                        placeholder="Your name..."
                    />
                </div>
            </div>

            <button
                onClick={save}
                disabled={isSaving}
                className="w-full py-2 rounded-lg bg-ink-blue text-white text-sm font-bold hover:bg-ink-blue-hover transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : isSaving ? "Saving..." : "Save Profile"}
            </button>
        </Panel>
    );
}
