"use client";

import { useState, useEffect } from "react";
import { Send, Users, Clock, AlignLeft } from "lucide-react";
import { Panel } from "@/components/ui/commons";

type DirectoryUser = {
    id: string;
    name: string;
    role: string;
    teamId: string | null;
    team: { countryName: string } | null;
};

export function MeetingRequestForm({ onSuccess }: { onSuccess?: () => void }) {
    const [users, setUsers] = useState<DirectoryUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    const [targetId, setTargetId] = useState("");
    const [title, setTitle] = useState("");
    const [note, setNote] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [duration, setDuration] = useState("30");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetch("/api/directory")
            .then((r) => r.json())
            .then((data) => {
                if (Array.isArray(data)) setUsers(data);
            })
            .finally(() => setLoadingUsers(false));
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (!targetId || !title || !date || !time) {
            setError("Please fill in all required fields.");
            return;
        }

        const proposedStartAt = new Date(`${date}T${time}`).toISOString();
        const targetUser = users.find(u => u.id === targetId);

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/meetings/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetUserId: targetId,
                    targetTeamId: targetUser?.teamId,
                    title,
                    note: note || undefined,
                    proposedStartAt,
                    durationMin: parseInt(duration, 10),
                }),
            });

            if (!res.ok) {
                const payload = await res.json();
                throw new Error(payload.error || "Failed to send request.");
            }

            setSuccess(true);
            setTargetId("");
            setTitle("");
            setNote("");
            setDate("");
            setTime("");
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Panel>
            <div className="mb-4 text-center sm:text-left">
                <h3 className="font-serif text-xl font-bold text-ink">Request a Bilateral</h3>
                <p className="text-sm text-ink/60">Propose a meeting with a delegation member.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-sm font-semibold text-alert-red">{error}</p>}
                {success && <p className="text-sm font-semibold text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-200">Meeting request sent successfully!</p>}

                <label className="block">
                    <span className="mb-1 block text-sm font-bold text-ink/70 flex items-center gap-1"><Users className="h-4 w-4" /> Target Delegation Member *</span>
                    <select
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        disabled={loadingUsers}
                        className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-ink shadow-sm focus:border-ink-blue outline-none"
                        required
                    >
                        <option value="" disabled>
                            {loadingUsers ? "Loading directory..." : "Select a person..."}
                        </option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name} ({u.team?.countryName ? `${u.role} - ${u.team.countryName}` : u.role})
                            </option>
                        ))}
                    </select>
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm font-bold text-ink/70">Subject / Agenda *</span>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-ink shadow-sm focus:border-ink-blue outline-none"
                        placeholder="e.g. Energy Transition Amendments"
                        required
                    />
                </label>

                <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                        <span className="mb-1 block text-sm font-bold text-ink/70 flex items-center gap-1"><Clock className="h-4 w-4" /> Date *</span>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-ink shadow-sm focus:border-ink-blue outline-none"
                            required
                        />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-sm font-bold text-ink/70 flex items-center gap-1"><Clock className="h-4 w-4" /> Time *</span>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-ink shadow-sm focus:border-ink-blue outline-none"
                            required
                        />
                    </label>
                </div>

                <label className="block">
                    <span className="mb-1 block text-sm font-bold text-ink/70 flex items-center gap-1"><AlignLeft className="h-4 w-4" /> Note (Optional)</span>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full rounded-lg border border-ink-border bg-white px-3 py-2 text-ink shadow-sm focus:border-ink-blue outline-none resize-none"
                        placeholder="Briefly describe the objective of this meeting..."
                        rows={3}
                    />
                </label>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-blue px-4 py-2.5 font-bold text-white shadow-md transition hover:bg-ink-blue/90 disabled:opacity-50"
                >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Sending..." : "Send Request"}
                </button>
            </form>
        </Panel>
    );
}
