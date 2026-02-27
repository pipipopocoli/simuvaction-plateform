"use client";

import { useState, FormEvent, useEffect } from "react";

type Document = {
    id: string;
    title: string;
    description: string | null;
    url: string;
    type: string;
    createdBy: { name: string, role: string };
    createdAt: string;
};

export function AdminDocumentsPanel() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [url, setUrl] = useState("");
    const [docType, setDocType] = useState("pdf");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    async function fetchDocuments() {
        try {
            const res = await fetch("/api/admin/documents");
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function handleAddDocument(e: FormEvent) {
        e.preventDefault();
        setIsPending(true);
        setError(null);

        try {
            const res = await fetch("/api/admin/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description, url, type: docType }),
            });

            if (!res.ok) {
                const payload = await res.json();
                setError(payload.error || "Failed to add document.");
            } else {
                setTitle("");
                setDescription("");
                setUrl("");
                setDocType("pdf");
                fetchDocuments();
            }
        } catch {
            setError("A network error occurred.");
        } finally {
            setIsPending(false);
        }
    }

    async function handleDeleteDocument(id: string) {
        if (!confirm("Are you sure you want to delete this document?")) return;
        try {
            const res = await fetch(`/api/admin/documents?id=${id}`, { method: "DELETE" });
            if (res.ok) fetchDocuments();
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="bg-white border border-[#E5E7EB] rounded p-6 shadow-sm">
            <h2 className="text-xl font-serif font-bold text-[#111827] mb-4">Official Library (Documents)</h2>

            <form onSubmit={handleAddDocument} className="mb-6 bg-[#FFFBF5] border border-[#E5E7EB] p-4 rounded">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-3">Add External Link / Document</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full text-sm rounded border-zinc-300 p-2" placeholder="e.g. UN Charter 1945" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">Type</label>
                        <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full text-sm rounded border-zinc-300 p-2">
                            <option value="pdf">PDF</option>
                            <option value="link">Web Link</option>
                            <option value="image">Image</option>
                        </select>
                    </div>
                </div>
                <div className="mb-3">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">File URL</label>
                    <input type="url" value={url} onChange={e => setUrl(e.target.value)} required className="w-full text-sm rounded border-zinc-300 p-2" placeholder="https://" />
                </div>
                <div className="mb-3">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Description (Optional)</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full text-sm rounded border-zinc-300 p-2" placeholder="Rules of procedure..." />
                </div>

                {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

                <button type="submit" disabled={isPending} className="bg-[#1E3A8A] text-white text-xs font-bold uppercase py-2 px-4 rounded hover:bg-blue-900 transition-colors">
                    {isPending ? "Adding..." : "Add to Library"}
                </button>
            </form>

            <div className="space-y-3">
                {documents.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic">No documents uploaded yet.</p>
                ) : (
                    documents.map(d => (
                        <div key={d.id} className="flex justify-between items-center p-3 border border-zinc-200 rounded">
                            <div>
                                <a href={d.url} target="_blank" rel="noreferrer" className="font-semibold text-sm text-[#1E3A8A] hover:underline">
                                    {d.title} <span className="text-[10px] text-zinc-400 font-mono uppercase">[{d.type}]</span>
                                </a>
                                <p className="text-xs text-zinc-500">{new Date(d.createdAt).toLocaleDateString()} • Added by {d.createdBy?.name}</p>
                            </div>
                            <button onClick={() => handleDeleteDocument(d.id)} className="text-xs text-red-600 hover:text-red-800 font-medium ml-4">Delete</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
