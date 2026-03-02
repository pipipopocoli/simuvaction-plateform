"use client";

import { useState, useCallback, useEffect } from "react";
import { UploadCloud, FileText, Lock, Globe2, Loader2, Trash2 } from "lucide-react";
import { DateTime } from "luxon";

type EventDocument = {
    id: string;
    title: string;
    description: string | null;
    url: string;
    type: string;
    isPublic: boolean;
    createdAt: string;
    createdBy: { name: string; displayRole: string | null };
    targetTeams?: { id: string; countryCode: string; countryName: string }[];
};

export function DocumentLibrary({ isAdmin }: { isAdmin: boolean }) {
    const [documents, setDocuments] = useState<EventDocument[]>([]);
    const [isDragActive, setIsDragActive] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // For Admins uploading
    const [uploadTitle, setUploadTitle] = useState("");
    const [uploadDescription, setUploadDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

    // (Mock load teams for admin dispatch)
    const [teams, setTeams] = useState<{ id: string, countryName: string }[]>([]);

    async function fetchDocs() {
        try {
            const res = await fetch("/api/documents");
            if (res.ok) setDocuments(await res.json());
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchDocs();
        if (isAdmin) {
            // Mock fetch teams for dispatch
            fetch("/api/settings") // actually we might need a dedicated team route, but assuming 5 sample teams for UI preview
                .catch(() => { });
        }
    }, [isAdmin]);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
    }, []);

    const onDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);

        if (!isAdmin) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        handleFileUpload(files[0]);
    }, [isAdmin]);

    const handleFileUpload = async (file: File) => {
        setIsUploading(true);
        try {
            // In a real implementation: upload to Vercel Blob here using @vercel/blob/client
            // For now, we simulate success and save metadata to API
            const fakeUrl = URL.createObjectURL(file);

            const res = await fetch("/api/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: uploadTitle || file.name,
                    description: uploadDescription,
                    url: fakeUrl,
                    type: "pdf",
                    isPublic: isPublic,
                    targetTeamIds: selectedTeams
                })
            });

            if (res.ok) {
                const doc = await res.json();
                setDocuments(prev => [doc, ...prev]);
                setUploadTitle("");
                setUploadDescription("");
            }
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-8 pb-12">
            <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-ink">Official Library</h1>
                    <p className="mt-1 text-ink/70">Access briefing materials and resolutions.</p>
                </div>
            </header>

            {isAdmin && (
                <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm">
                    <h2 className="mb-4 font-serif text-xl font-bold text-ink">Admin Upload & Dispatch</h2>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-ink">Document Title</label>
                                <input
                                    type="text"
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                    className="w-full rounded-md border border-zinc-300 p-2 text-sm" placeholder="e.g. UN Final Resolution Draft"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-ink">Access Level</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="radio" checked={isPublic} onChange={() => setIsPublic(true)} />
                                        All Delegations (Public)
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="radio" checked={!isPublic} onChange={() => setIsPublic(false)} />
                                        Restricted
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            className={`flex h-full min-h-[140px] flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${isDragActive ? "border-blue-500 bg-blue-100/50" : "border-zinc-300 bg-white"
                                }`}
                        >
                            {isUploading ? (
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            ) : (
                                <>
                                    <UploadCloud className={`mb-2 h-8 w-8 ${isDragActive ? 'text-blue-500' : 'text-zinc-400'}`} />
                                    <p className="text-sm font-medium text-ink">Drag & Drop file here</p>
                                    <p className="text-xs text-zinc-500">Supports PDF, DOCX (Max 10MB)</p>
                                </>
                            )}
                        </div>
                    </div>
                </section>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full py-12 text-center text-zinc-400">Loading documents...</div>
                ) : documents.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-zinc-500 bg-white rounded-xl border border-dashed border-zinc-300">
                        No official documents have been published yet.
                    </div>
                ) : (
                    documents.map(doc => (
                        <a
                            key={doc.id}
                            href={doc.url}
                            target="_blank"
                            className="group relative flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
                        >
                            <div className="mb-3 flex items-start justify-between">
                                <div className="rounded-lg bg-red-100 p-2 text-red-600">
                                    <FileText className="h-6 w-6" />
                                </div>
                                {doc.isPublic ? (
                                    <Globe2 className="h-4 w-4 text-zinc-400" />
                                ) : (
                                    <Lock className="h-4 w-4 text-amber-500" />
                                )}
                            </div>
                            <h3 className="font-serif text-lg font-bold leading-tight text-ink group-hover:text-blue-600">
                                {doc.title}
                            </h3>
                            {doc.description && <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{doc.description}</p>}

                            <div className="mb-2 mt-auto pt-4 text-xs text-zinc-500">
                                <span className="font-semibold">{doc.createdBy?.name || "Admin"}</span> • {DateTime.fromISO(doc.createdAt).toFormat("LLL dd, HH:mm")}
                            </div>
                        </a>
                    ))
                )}
            </div>
        </div>
    );
}
