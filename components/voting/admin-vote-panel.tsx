"use client";

import { useState } from "react";
import { Plus, X, Users, Eye, EyeOff } from "lucide-react";

export function AdminVotePanel() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [options, setOptions] = useState<string[]>(["Pour", "Contre", "Abstention"]);
    const [visibility, setVisibility] = useState<"public" | "secret">("public");
    const [voteType, setVoteType] = useState<"per_delegation" | "per_person">("per_delegation");
    const [quorumPercent, setQuorumPercent] = useState<number>(50);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateVote = async () => {
        if (!title.trim() || options.length < 2) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/votes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    status: "active", // Activate immediately for testing
                    visibility,
                    voteType,
                    quorumPercent,
                    options: options.filter(o => o.trim() !== "")
                })
            });

            if (res.ok) {
                setTitle("");
                setDescription("");
                // Refresh or trigger event
                alert("Vote lancé avec succès !");
            } else {
                const data = await res.json();
                alert(`Erreur: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addOption = () => setOptions([...options, ""]);
    const updateOption = (index: number, val: string) => {
        const newOpts = [...options];
        newOpts[index] = val;
        setOptions(newOpts);
    };
    const removeOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Lancer un Votem (Admin)
            </h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Titre de la Résolution</label>
                    <input
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:outline-none focus:border-blue-500 transition"
                        placeholder="Ex: Résolution 45-B sur le Climat"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Description (Optionnel)</label>
                    <textarea
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:outline-none focus:border-blue-500 transition min-h-24"
                        placeholder="Détails du vote..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Mode de Scrutin</label>
                        <select
                            className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            value={visibility}
                            onChange={(e) => setVisibility(e.target.value as "public" | "secret")}
                        >
                            <option value="public">Publique (Main Levée)</option>
                            <option value="secret">Secret (Urne fermée)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Type de Quota</label>
                        <select
                            className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            value={voteType}
                            onChange={(e) => setVoteType(e.target.value as "per_delegation" | "per_person")}
                        >
                            <option value="per_delegation">1 Vote par Pays (Délégation)</option>
                            <option value="per_person">1 Vote par Personne</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Les Options de Vote</label>
                    <div className="space-y-2">
                        {options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <input
                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:outline-none focus:border-blue-500 transition"
                                    value={opt}
                                    onChange={(e) => updateOption(i, e.target.value)}
                                />
                                {options.length > 2 && (
                                    <button onClick={() => removeOption(i)} className="p-2 text-zinc-500 hover:text-red-400 transition" title="Retirer">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={addOption}
                        className="mt-3 flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition"
                    >
                        <Plus className="w-4 h-4" /> Ajouter une option
                    </button>
                </div>

                <div className="pt-4 border-t border-zinc-800">
                    <button
                        onClick={handleCreateVote}
                        disabled={isSubmitting || !title.trim() || options.length < 2}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Lancement en cours..." : "Lancer le Vote Maintenant"}
                    </button>
                </div>
            </div>
        </div>
    );
}
