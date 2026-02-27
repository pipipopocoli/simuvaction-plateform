"use client";

import { useState, useCallback, useRef, useMemo, type ReactNode } from "react";
import {
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronRight,
  GripVertical,
  StickyNote,
  ListChecks,
  BookOpen,
  Link2,
  PenTool,
  Save,
  Clock,
  CalendarDays,
} from "lucide-react";
import { Panel } from "@/components/ui/commons";

type CheckItem = { id: string; text: string; done: boolean };
type JournalEntry = { id: string; date: string; content: string };

type WorkspaceBlock =
  | { id: string; type: "note"; title: string; content: string }
  | { id: string; type: "checklist"; title: string; content: string; items: CheckItem[] }
  | { id: string; type: "ref"; title: string; content: string }
  | { id: string; type: "journal"; title: string; entries: JournalEntry[]; system: true };

const uid = () => Math.random().toString(36).slice(2, 10);

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function ensureTodayJournalEntry(block: WorkspaceBlock): WorkspaceBlock {
  if (block.type !== "journal") {
    return block;
  }

  const today = todayKey();
  if (block.entries.some((entry) => entry.date === today)) {
    return block;
  }

  return {
    ...block,
    entries: [{ id: uid(), date: today, content: "" }, ...block.entries],
  };
}

function defaultBlocks(): WorkspaceBlock[] {
  return [
    {
      id: "journal-system",
      type: "journal",
      title: "Daily Journal",
      system: true,
      entries: [{ id: uid(), date: todayKey(), content: "" }],
    },
    {
      id: "1",
      type: "note",
      title: "Welcome to your workspace",
      content:
        "Use this space to organize your research, talking points, and notes for the simulation. Create checklists, save references, and collaborate with your team.",
    },
    {
      id: "2",
      type: "checklist",
      title: "Preparation Checklist",
      content: "",
      items: [
        { id: uid(), text: "Read the background document", done: false },
        { id: uid(), text: "Prepare opening statement", done: false },
        { id: uid(), text: "Identify ally delegations", done: false },
        { id: uid(), text: "Draft bilateral requests", done: false },
      ],
    },
  ];
}

function ChecklistBlock({ block, onChange }: { block: Extract<WorkspaceBlock, { type: "checklist" }>; onChange: (b: WorkspaceBlock) => void }) {
  const items = block.items ?? [];
  const addItem = () => onChange({ ...block, items: [...items, { id: uid(), text: "New task", done: false }] });
  const toggle = (id: string) =>
    onChange({ ...block, items: items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)) });
  const edit = (id: string, text: string) =>
    onChange({ ...block, items: items.map((item) => (item.id === id ? { ...item, text } : item)) });
  const remove = (id: string) => onChange({ ...block, items: items.filter((item) => item.id !== id) });

  const done = items.filter((item) => item.done).length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-ink-blue" />
          <span className="text-xs font-bold uppercase tracking-widest text-ink/60">
            {done}/{items.length} done
          </span>
        </div>
        <div className="mx-3 h-1 flex-1 overflow-hidden rounded-full bg-ink-border">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: items.length ? `${(done / items.length) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {items.map((item) => (
        <div key={item.id} className="group mb-1.5 flex items-start gap-2">
          <button
            onClick={() => toggle(item.id)}
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
              item.done ? "border-emerald-500 bg-emerald-500" : "border-ink-border"
            }`}
          >
            {item.done && <Check className="h-2.5 w-2.5 text-white" />}
          </button>
          <input
            value={item.text}
            onChange={(event) => edit(item.id, event.target.value)}
            className={`flex-1 bg-transparent text-sm outline-none ${item.done ? "text-ink/40 line-through" : "text-ink"}`}
          />
          <button onClick={() => remove(item.id)} className="text-ink/30 opacity-0 transition hover:text-alert-red group-hover:opacity-100">
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

function NoteTextBlock({ block, onChange }: { block: Extract<WorkspaceBlock, { type: "note" }>; onChange: (b: WorkspaceBlock) => void }) {
  return (
    <textarea
      value={block.content}
      onChange={(event) => onChange({ ...block, content: event.target.value })}
      placeholder="Write your notes, research insights, bilateral strategy..."
      className="min-h-[120px] w-full resize-none bg-transparent font-serif text-sm leading-relaxed text-ink outline-none"
    />
  );
}

function RefBlock({ block, onChange }: { block: Extract<WorkspaceBlock, { type: "ref" }>; onChange: (b: WorkspaceBlock) => void }) {
  const lines = block.content.split("\n").filter(Boolean);
  return (
    <div>
      <div className="mb-2 space-y-1.5">
        {lines.map((line, index) => {
          const isUrl = line.startsWith("http");
          return (
            <div key={`${line}-${index}`} className="flex items-center gap-2 text-sm">
              <Link2 className="h-3.5 w-3.5 shrink-0 text-ink-blue" />
              {isUrl ? (
                <a href={line} target="_blank" rel="noreferrer" className="truncate text-ink-blue hover:underline">
                  {line}
                </a>
              ) : (
                <span className="italic text-ink/70">{line}</span>
              )}
            </div>
          );
        })}
      </div>
      <textarea
        value={block.content}
        onChange={(event) => onChange({ ...block, content: event.target.value })}
        placeholder={"Add references, one per line.\nPaste URLs (they become links) or Zotero-style citations."}
        rows={4}
        className="w-full resize-none bg-transparent font-mono text-xs leading-relaxed text-ink/70 outline-none"
      />
      <p className="mt-1 text-[10px] text-ink/40">Zotero API integration available - paste DOI or URL links</p>
    </div>
  );
}

function JournalBlock({ block, onChange }: { block: Extract<WorkspaceBlock, { type: "journal" }>; onChange: (b: WorkspaceBlock) => void }) {
  const sortedEntries = [...block.entries].sort((left, right) => right.date.localeCompare(left.date));

  function updateEntry(entryId: string, content: string) {
    onChange({
      ...block,
      entries: block.entries.map((entry) => (entry.id === entryId ? { ...entry, content } : entry)),
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink/60">
        Write one short recap per day. Today&apos;s entry is created automatically.
      </p>

      {sortedEntries.map((entry) => (
        <div key={entry.id} className="rounded-lg border border-ink-border bg-ivory p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">{entry.date}</p>
          <textarea
            value={entry.content}
            onChange={(event) => updateEntry(entry.id, event.target.value)}
            placeholder="Short summary of the day..."
            className="mt-2 min-h-[84px] w-full resize-none rounded-md border border-ink-border bg-[var(--color-surface)] px-2 py-1.5 text-sm text-ink outline-none"
          />
        </div>
      ))}
    </div>
  );
}

type NotionWorkspaceProps = {
  teamName?: string;
  userId: string;
  workspaceKey: string;
};

export function NotionWorkspace({ teamName, userId, workspaceKey }: NotionWorkspaceProps) {
  const storageKey = useMemo(() => `workspace_blocks:${workspaceKey}:${userId}`, [workspaceKey, userId]);

  const [blocks, setBlocks] = useState<WorkspaceBlock[]>(() => {
    if (typeof window === "undefined") {
      return defaultBlocks();
    }

    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        return defaultBlocks();
      }

      const parsed = JSON.parse(saved) as WorkspaceBlock[];
      const withJournal = parsed.some((block) => block.type === "journal")
        ? parsed
        : [defaultBlocks()[0], ...parsed];

      return withJournal.map((block) => ensureTodayJournalEntry(block));
    } catch {
      return defaultBlocks();
    }
  });

  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "journal-system": true,
    "1": true,
    "2": true,
  });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    (data: WorkspaceBlock[]) => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }

      saveTimer.current = setTimeout(() => {
        localStorage.setItem(storageKey, JSON.stringify(data));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }, 700);
    },
    [storageKey],
  );

  const update = (block: WorkspaceBlock) => {
    const next = blocks.map((candidate) => (candidate.id === block.id ? block : candidate));
    setBlocks(next);
    persist(next);
  };

  const addBlock = (type: "note" | "checklist" | "ref") => {
    const newBlock: WorkspaceBlock =
      type === "checklist"
        ? { id: uid(), type, title: "New Checklist", content: "", items: [] }
        : { id: uid(), type, title: type === "ref" ? "References" : "New Note", content: "" };

    const next = [...blocks, newBlock];
    setBlocks(next);
    persist(next);
    setExpanded((prev) => ({ ...prev, [newBlock.id]: true }));
  };

  const removeBlock = (id: string) => {
    const block = blocks.find((candidate) => candidate.id === id);
    if (!block || block.type === "journal") {
      return;
    }

    const next = blocks.filter((candidate) => candidate.id !== id);
    setBlocks(next);
    persist(next);
  };

  const toggleExpand = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const icons: Record<WorkspaceBlock["type"], ReactNode> = {
    note: <StickyNote className="h-4 w-4 text-amber-500" />,
    checklist: <ListChecks className="h-4 w-4 text-emerald-600" />,
    ref: <BookOpen className="h-4 w-4 text-ink-blue" />,
    journal: <CalendarDays className="h-4 w-4 text-ink-blue" />,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-ink">
            <PenTool className="h-5 w-5 text-ink-blue" />
            {teamName ? `${teamName}'s Workspace` : "Team Workspace"}
          </h2>
          <p className="mt-0.5 text-xs text-ink/50">Notion-style notes, checklists, references, and daily journal</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <Save className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          <Clock className="h-3.5 w-3.5 text-ink/30" />
        </div>
      </div>

      {blocks.map((block) => (
        <Panel key={block.id} className="group transition-all">
          <div className="-mx-4 -mt-4 mb-3 flex items-center gap-2 border-b border-ink-border/50 px-4 pb-2 pt-4">
            <GripVertical className="h-4 w-4 cursor-grab text-ink/20" />
            {icons[block.type]}
            <input
              value={block.title}
              onChange={(event) => update({ ...block, title: event.target.value })}
              className="flex-1 bg-transparent text-sm font-bold text-ink outline-none"
              readOnly={block.type === "journal"}
            />
            <button onClick={() => toggleExpand(block.id)} className="text-ink/30 transition hover:text-ink">
              {expanded[block.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {block.type !== "journal" ? (
              <button onClick={() => removeBlock(block.id)} className="text-ink/30 opacity-0 transition hover:text-alert-red group-hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          {expanded[block.id] ? (
            <div>
              {block.type === "note" && <NoteTextBlock block={block} onChange={update} />}
              {block.type === "checklist" && <ChecklistBlock block={block} onChange={update} />}
              {block.type === "ref" && <RefBlock block={block} onChange={update} />}
              {block.type === "journal" && <JournalBlock block={block} onChange={update} />}
            </div>
          ) : null}
        </Panel>
      ))}

      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs font-bold uppercase tracking-widest text-ink/40">Add block</span>
        <button
          onClick={() => addBlock("note")}
          className="flex items-center gap-1 rounded-md border border-ink-border bg-[var(--color-surface)] px-2 py-1 text-xs font-semibold text-ink transition hover:border-ink-blue hover:text-ink-blue"
        >
          <StickyNote className="h-3.5 w-3.5" /> Note
        </button>
        <button
          onClick={() => addBlock("checklist")}
          className="flex items-center gap-1 rounded-md border border-ink-border bg-[var(--color-surface)] px-2 py-1 text-xs font-semibold text-ink transition hover:border-emerald-500 hover:text-emerald-600"
        >
          <ListChecks className="h-3.5 w-3.5" /> Checklist
        </button>
        <button
          onClick={() => addBlock("ref")}
          className="flex items-center gap-1 rounded-md border border-ink-border bg-[var(--color-surface)] px-2 py-1 text-xs font-semibold text-ink transition hover:border-ink-blue hover:text-ink-blue"
        >
          <BookOpen className="h-3.5 w-3.5" /> References
        </button>
      </div>
    </div>
  );
}
