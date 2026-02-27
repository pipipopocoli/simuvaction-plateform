"use client";

import { useState, useCallback, useRef, type ReactNode } from "react";
import {
    Plus, Trash2, Check, ChevronDown, ChevronRight, GripVertical,
    StickyNote, ListChecks, BookOpen, Link2, PenTool, Save, Clock
} from "lucide-react";
import { Panel } from "@/components/ui/commons";

// ─── types ─────────────────────────────────────────────────────────
type CheckItem = { id: string; text: string; done: boolean };
type NoteBlock = { id: string; type: "note" | "checklist" | "ref"; title: string; content: string; items?: CheckItem[] };

// ─── tiny helpers ───────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const inital: NoteBlock[] = [
    { id: "1", type: "note", title: "Welcome to your workspace", content: "Use this space to organize your research, talking points, and notes for the simulation. Create checklists, save references, and collaborate with your team." },
    {
        id: "2", type: "checklist", title: "Preparation Checklist", content: "", items: [
            { id: uid(), text: "Read the background document", done: false },
            { id: uid(), text: "Prepare opening statement", done: false },
            { id: uid(), text: "Identify ally delegations", done: false },
            { id: uid(), text: "Draft bilateral requests", done: false },
        ]
    },
];

// ─── sub-components ─────────────────────────────────────────────────
function ChecklistBlock({ block, onChange }: { block: NoteBlock; onChange: (b: NoteBlock) => void }) {
    const items = block.items ?? [];
    const addItem = () => onChange({ ...block, items: [...items, { id: uid(), text: "New task", done: false }] });
    const toggle = (id: string) =>
        onChange({ ...block, items: items.map(i => i.id === id ? { ...i, done: !i.done } : i) });
    const edit = (id: string, text: string) =>
        onChange({ ...block, items: items.map(i => i.id === id ? { ...i, text } : i) });
    const remove = (id: string) => onChange({ ...block, items: items.filter(i => i.id !== id) });

    const done = items.filter(i => i.done).length;

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-ink-blue" />
                    <span className="text-xs font-bold uppercase tracking-widest text-ink/60">{done}/{items.length} done</span>
                </div>
                <div className="h-1 flex-1 mx-3 bg-ink-border rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: items.length ? `${(done / items.length) * 100}%` : "0%" }} />
                </div>
            </div>
            {items.map(item => (
                <div key={item.id} className="flex items-start gap-2 group mb-1.5">
                    <button onClick={() => toggle(item.id)} className={`mt-0.5 h-4 w-4 shrink-0 rounded border transition ${item.done ? "bg-emerald-500 border-emerald-500" : "border-ink-border"} flex items-center justify-center`}>
                        {item.done && <Check className="h-2.5 w-2.5 text-white" />}
                    </button>
                    <input
                        value={item.text}
                        onChange={e => edit(item.id, e.target.value)}
                        className={`flex-1 bg-transparent text-sm outline-none ${item.done ? "line-through text-ink/40" : "text-ink"}`}
                    />
                    <button onClick={() => remove(item.id)} className="opacity-0 group-hover:opacity-100 transition text-ink/30 hover:text-alert-red">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            ))}
            <button onClick={addItem} className="mt-2 flex items-center gap-1.5 text-xs text-ink-blue hover:underline">
                <Plus className="h-3 w-3" /> Add item
            </button>
        </div>
    );
}

function NoteBlock({ block, onChange }: { block: NoteBlock; onChange: (b: NoteBlock) => void }) {
    return (
        <textarea
            value={block.content}
            onChange={e => onChange({ ...block, content: e.target.value })}
            placeholder="Write your notes, research insights, bilateral strategy…"
            className="w-full bg-transparent resize-none outline-none text-sm text-ink leading-relaxed min-h-[120px] font-serif"
        />
    );
}

function RefBlock({ block, onChange }: { block: NoteBlock; onChange: (b: NoteBlock) => void }) {
    const lines = block.content.split("\n").filter(Boolean);
    return (
        <div>
            <div className="space-y-1.5 mb-2">
                {lines.map((line, i) => {
                    const isUrl = line.startsWith("http");
                    return (
                        <div key={i} className="flex items-center gap-2 text-sm">
                            <Link2 className="h-3.5 w-3.5 text-ink-blue shrink-0" />
                            {isUrl ? (
                                <a href={line} target="_blank" rel="noreferrer" className="text-ink-blue hover:underline truncate">{line}</a>
                            ) : (
                                <span className="text-ink/70 italic">{line}</span>
                            )}
                        </div>
                    );
                })}
            </div>
            <textarea
                value={block.content}
                onChange={e => onChange({ ...block, content: e.target.value })}
                placeholder={"Add references, one per line.\nPaste URLs (they become links) or Zotero-style citations."}
                rows={4}
                className="w-full bg-transparent resize-none outline-none text-xs text-ink/70 font-mono leading-relaxed"
            />
            <p className="text-[10px] text-ink/40 mt-1">Zotero API integration available – paste DOI or URL links</p>
        </div>
    );
}

// ─── main export ────────────────────────────────────────────────────
export function NotionWorkspace({ teamName }: { teamName?: string }) {
    const [blocks, setBlocks] = useState<NoteBlock[]>(() => {
        if (typeof window === "undefined") {
            return inital;
        }

        try {
            const saved = localStorage.getItem("workspace_blocks");
            return saved ? (JSON.parse(saved) as NoteBlock[]) : inital;
        } catch {
            return inital;
        }
    });
    const [saved, setSaved] = useState(false);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({ "1": true, "2": true });
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-save to localStorage (real app would save to DB)
    const persist = useCallback((data: NoteBlock[]) => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            localStorage.setItem("workspace_blocks", JSON.stringify(data));
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        }, 900);
    }, []);

    const update = (b: NoteBlock) => {
        const next = blocks.map(bl => bl.id === b.id ? b : bl);
        setBlocks(next);
        persist(next);
    };

    const addBlock = (type: NoteBlock["type"]) => {
        const nb: NoteBlock = {
            id: uid(), type, title: type === "checklist" ? "New Checklist" : type === "ref" ? "References" : "New Note",
            content: "", items: type === "checklist" ? [] : undefined
        };
        const next = [...blocks, nb];
        setBlocks(next);
        persist(next);
        setExpanded(e => ({ ...e, [nb.id]: true }));
    };

    const removeBlock = (id: string) => {
        const next = blocks.filter(b => b.id !== id);
        setBlocks(next);
        persist(next);
    };

    const toggleExpand = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));

    const icons: Record<NoteBlock["type"], ReactNode> = {
        note: <StickyNote className="h-4 w-4 text-amber-500" />,
        checklist: <ListChecks className="h-4 w-4 text-emerald-600" />,
        ref: <BookOpen className="h-4 w-4 text-ink-blue" />,
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
                        <PenTool className="h-5 w-5 text-ink-blue" />
                        {teamName ? `${teamName}'s Workspace` : "Team Workspace"}
                    </h2>
                    <p className="text-xs text-ink/50 mt-0.5">Notion-style notes, checklists, and references — auto-saved</p>
                </div>
                <div className="flex items-center gap-2">
                    {saved && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                            <Save className="h-3.5 w-3.5" /> Saved
                        </span>
                    )}
                    <Clock className="h-3.5 w-3.5 text-ink/30" />
                </div>
            </div>

            {/* Blocks */}
            {blocks.map(block => (
                <Panel key={block.id} className="group transition-all">
                    {/* Block header */}
                    <div className="flex items-center gap-2 -mx-4 -mt-4 px-4 pt-4 pb-2 border-b border-ink-border/50 mb-3">
                        <GripVertical className="h-4 w-4 text-ink/20 cursor-grab" />
                        {icons[block.type]}
                        <input
                            value={block.title}
                            onChange={e => update({ ...block, title: e.target.value })}
                            className="flex-1 bg-transparent text-sm font-bold text-ink outline-none"
                        />
                        <button onClick={() => toggleExpand(block.id)} className="text-ink/30 hover:text-ink transition">
                            {expanded[block.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        <button onClick={() => removeBlock(block.id)} className="opacity-0 group-hover:opacity-100 transition text-ink/30 hover:text-alert-red">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {/* Block content */}
                    {expanded[block.id] && (
                        <div>
                            {block.type === "note" && <NoteBlock block={block} onChange={update} />}
                            {block.type === "checklist" && <ChecklistBlock block={block} onChange={update} />}
                            {block.type === "ref" && <RefBlock block={block} onChange={update} />}
                        </div>
                    )}
                </Panel>
            ))}

            {/* Add block bar */}
            <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-ink/40 uppercase tracking-widest font-bold">Add block</span>
                <button onClick={() => addBlock("note")} className="flex items-center gap-1 rounded-md border border-ink-border bg-white px-2 py-1 text-xs font-semibold text-ink hover:border-ink-blue hover:text-ink-blue transition">
                    <StickyNote className="h-3.5 w-3.5" /> Note
                </button>
                <button onClick={() => addBlock("checklist")} className="flex items-center gap-1 rounded-md border border-ink-border bg-white px-2 py-1 text-xs font-semibold text-ink hover:border-emerald-500 hover:text-emerald-600 transition">
                    <ListChecks className="h-3.5 w-3.5" /> Checklist
                </button>
                <button onClick={() => addBlock("ref")} className="flex items-center gap-1 rounded-md border border-ink-border bg-white px-2 py-1 text-xs font-semibold text-ink hover:border-ink-blue hover:text-ink-blue transition">
                    <BookOpen className="h-3.5 w-3.5" /> References
                </button>
            </div>
        </div>
    );
}
