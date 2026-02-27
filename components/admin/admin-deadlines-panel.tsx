"use client";

import { useState, FormEvent, useEffect } from "react";

type Deadline = {
    id: string;
    title: string;
    description: string | null;
    date: string;
    createdBy: { name: string, role: string };
};

export function AdminDeadlinesPanel() {
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDeadlines();
    }, []);

    async function fetchDeadlines() {
        try {
            const res = await fetch("/api/admin/deadlines");
            if (res.ok) {
                const data = await res.json();
                setDeadlines(data);
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function handleAddDeadline(e: FormEvent) {
        e.preventDefault();
        setIsPending(true);
        setError(null);

        try {
            const res = await fetch("/api/admin/deadlines", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description, date }),
            });

            if (!res.ok) {
                const payload = await res.json();
                setError(payload.error || "Failed to add deadline.");
            } else {
                setTitle("");
                setDescription("");
                setDate("");
                fetchDeadlines();
            }
        } catch (err) {
            setError("A network error occurred.");
        } finally {
            setIsPending(false);
        }
    }

    async function handleDeleteDeadline(id: string) {
        if (!confirm("Are you sure you want to delete this deadline?")) return;
        try {
            const res = await fetch(`/api/admin/deadlines?id=${id}`, { method: "DELETE" });
            if (res.ok) fetchDeadlines();
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className="bg-white border border-[#E5E7EB] rounded p-6 shadow-sm">
            <h2 className="text-xl font-serif font-bold text-[#111827] mb-4">Official Deadlines</h2>

            <form onSubmit={handleAddDeadline} className="mb-6 bg-[#FFFBF5] border border-[#E5E7EB] p-4 rounded">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-3">Add New Deadline</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full text-sm rounded border-zinc-300 p-2" placeholder="e.g. Resolution Drafts Due" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">Date & Time</label>
                        <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required className="w-full text-sm rounded border-zinc-300 p-2" />
                    </div>
                </div>
                <div className="mb-3">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Description (Optional)</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full text-sm rounded border-zinc-300 p-2" placeholder="Brief details..." />
                </div>

                {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

                <button type="submit" disabled={isPending} className="bg-[#1E3A8A] text-white text-xs font-bold uppercase py-2 px-4 rounded hover:bg-blue-900 transition-colors">
                    {isPending ? "Adding..." : "Publish Deadline"}
                </button>
            </form>

            <div className="space-y-3">
                {deadlines.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic">No official deadlines scheduled yet.</p>
                ) : (
                    deadlines.map(d => (
                        <div key={d.id} className="flex justify-between items-center p-3 border border-zinc-200 rounded">
                            <div>
                                <p className="font-semibold text-sm text-[#111827]">{d.title}</p>
                                <p className="text-xs text-zinc-500">{new Date(d.date).toLocaleString()} • Added by {d.createdBy?.name}</p>
                            </div>
                            <button onClick={() => handleDeleteDeadline(d.id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Delete</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
