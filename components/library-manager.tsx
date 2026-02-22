"use client";

import { LibraryItemType } from "@prisma/client";
import { useMemo, useState } from "react";

type LibraryItem = {
  id: string;
  type: LibraryItemType;
  title: string;
  url: string;
  tags: string[];
  pillarId: string | null;
  taskId: string | null;
  createdAt: string;
};

type Option = {
  id: string;
  name: string;
};

type TaskOption = {
  id: string;
  title: string;
  pillarName: string;
};

type LibraryManagerProps = {
  initialItems: LibraryItem[];
  pillars: Option[];
  tasks: TaskOption[];
};

export function LibraryManager({ initialItems, pillars, tasks }: LibraryManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [activeTab, setActiveTab] = useState<LibraryItemType>(LibraryItemType.SOURCE);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [pillarId, setPillarId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filteredItems = useMemo(
    () => items.filter((item) => item.type === activeTab),
    [items, activeTab],
  );

  async function reloadItems() {
    const response = await fetch("/api/library/items", {
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    const normalizedItems = (payload.items as LibraryItem[]).map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt).toISOString(),
    }));
    setItems(normalizedItems);
  }

  function resetForm() {
    setTitle("");
    setUrl("");
    setTagsInput("");
    setPillarId("");
    setTaskId("");
    setEditingId(null);
    setError(null);
  }

  async function saveItem() {
    setError(null);

    if (!title.trim() || !url.trim()) {
      setError("Title and URL are required.");
      return;
    }

    setIsSaving(true);

    const tags = tagsInput
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const payload = {
      type: activeTab,
      title: title.trim(),
      url: url.trim(),
      tags,
      pillarId: pillarId || null,
      taskId: taskId || null,
    };

    try {
      const response = await fetch("/api/library/items", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });

      if (!response.ok) {
        setError("Failed to save library item. Check URL and fields.");
        return;
      }

      await reloadItems();
      resetForm();
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(item: LibraryItem) {
    setEditingId(item.id);
    setActiveTab(item.type);
    setTitle(item.title);
    setUrl(item.url);
    setTagsInput(item.tags.join(", "));
    setPillarId(item.pillarId ?? "");
    setTaskId(item.taskId ?? "");
  }

  async function removeItem(id: string) {
    await fetch(`/api/library/items?id=${id}`, {
      method: "DELETE",
    });

    if (editingId === id) {
      resetForm();
    }

    await reloadItems();
  }

  return (
    <div className="space-y-6">
      <section className="card-panel rounded-lg p-6">
        <h1 className="text-2xl font-semibold">Library</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Manage links for sources and drafts. File uploads/sync are not in v1.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab(LibraryItemType.SOURCE)}
            className={`rounded px-3 py-1.5 text-sm ${
              activeTab === LibraryItemType.SOURCE
                ? "bg-zinc-900 text-zinc-100"
                : "bg-zinc-200 text-zinc-700"
            }`}
          >
            Sources
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(LibraryItemType.DRAFT)}
            className={`rounded px-3 py-1.5 text-sm ${
              activeTab === LibraryItemType.DRAFT
                ? "bg-zinc-900 text-zinc-100"
                : "bg-zinc-200 text-zinc-700"
            }`}
          >
            Drafts
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card-panel rounded-lg p-5">
          <h2 className="text-lg font-semibold">
            {editingId ? "Edit library item" : "Add library item"}
          </h2>

          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium">Title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">URL / Link</label>
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Tags (comma-separated)</label>
              <input
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Related pillar (optional)</label>
                <select
                  value={pillarId}
                  onChange={(event) => setPillarId(event.target.value)}
                  className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2"
                >
                  <option value="">None</option>
                  {pillars.map((pillar) => (
                    <option key={pillar.id} value={pillar.id}>
                      {pillar.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Related task (optional)</label>
                <select
                  value={taskId}
                  onChange={(event) => setTaskId(event.target.value)}
                  className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2"
                >
                  <option value="">None</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      [{task.pillarName}] {task.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveItem}
                disabled={isSaving}
                className="rounded border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-800 disabled:opacity-70"
              >
                {isSaving ? "Saving..." : editingId ? "Save changes" : "Add item"}
              </button>

              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded border border-zinc-400 px-3 py-1.5 text-sm hover:bg-zinc-200"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="card-panel rounded-lg p-5">
          <h2 className="text-lg font-semibold">{activeTab === "SOURCE" ? "Sources" : "Drafts"}</h2>

          <p className="mt-2 rounded border border-dashed border-zinc-400 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
            Upload / Download / Sync: Coming soon.
          </p>

          <ul className="mt-4 space-y-3">
            {filteredItems.map((item) => (
              <li key={item.id} className="rounded border border-zinc-300 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-zinc-900 underline"
                    >
                      {item.title}
                    </a>
                    <p className="mt-1 text-xs text-zinc-500">
                      Added {new Date(item.createdAt).toLocaleString("en-US")}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">Tags: {item.tags.join(", ") || "None"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="rounded border border-zinc-400 px-2 py-1 text-xs hover:bg-zinc-200"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded border border-zinc-400 px-2 py-1 text-xs hover:bg-zinc-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {filteredItems.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No items yet in this tab.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
