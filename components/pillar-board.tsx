"use client";

import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskStatus } from "@prisma/client";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";

type SortMode = "manual" | "priority" | "deadline";

type TagOption = {
  id: string;
  name: string;
};

type ChecklistItemData = {
  id: string;
  text: string;
  isDone: boolean;
  orderIndex: number;
};

type ChecklistSectionData = {
  id: string;
  title: string;
  orderIndex: number;
  items: ChecklistItemData[];
};

type AttachmentData = {
  id: string;
  title: string;
  url: string;
};

type TaskData = {
  id: string;
  pillarId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  deadline: string;
  priority: number;
  urgent: boolean;
  orderIndex: number;
  tags: Array<{ tagId: string; tag: TagOption }>;
  checklistSections: ChecklistSectionData[];
  attachments: AttachmentData[];
};

type PillarBoardProps = {
  pillar: {
    id: string;
    name: string;
    slug: string;
  };
  initialTasks: TaskData[];
  tags: TagOption[];
};

const STATUS_COLUMNS: Array<{ status: TaskStatus; label: string }> = [
  { status: TaskStatus.NEW, label: "New" },
  { status: TaskStatus.DOING, label: "Doing" },
  { status: TaskStatus.DONE, label: "Done" },
  { status: TaskStatus.ARCHIVED, label: "Archived" },
];

function statusToColumnId(status: TaskStatus): string {
  return `column-${status}`;
}

function columnIdToStatus(id: string): TaskStatus | null {
  if (!id.startsWith("column-")) {
    return null;
  }

  const raw = id.replace("column-", "");
  if (raw === TaskStatus.NEW) return TaskStatus.NEW;
  if (raw === TaskStatus.DOING) return TaskStatus.DOING;
  if (raw === TaskStatus.DONE) return TaskStatus.DONE;
  if (raw === TaskStatus.ARCHIVED) return TaskStatus.ARCHIVED;
  return null;
}

function sortTasks(tasks: TaskData[], mode: SortMode): TaskData[] {
  const cloned = [...tasks];

  if (mode === "priority") {
    cloned.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
    return cloned;
  }

  if (mode === "deadline") {
    cloned.sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
    );
    return cloned;
  }

  cloned.sort((a, b) => a.orderIndex - b.orderIndex);
  return cloned;
}

function formatDeadlineParis(iso: string): string {
  return DateTime.fromISO(iso).setZone("Europe/Paris").toFormat("dd LLL yyyy, HH:mm");
}

function toParisIso(datetimeLocalValue: string): string {
  return DateTime.fromISO(datetimeLocalValue, { zone: "Europe/Paris" }).toUTC().toISO() ?? "";
}

function fromParisIsoForInput(iso: string): string {
  return DateTime.fromISO(iso).setZone("Europe/Paris").toFormat("yyyy-LL-dd'T'HH:mm");
}

function priorityBadgeClass(priority: number): string {
  if (priority === 1) return "bg-zinc-900 text-zinc-100";
  if (priority === 2) return "bg-zinc-700 text-zinc-100";
  return "bg-zinc-300 text-zinc-900";
}

function UrgentMarker() {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-red-400 bg-red-50 px-1.5 py-0.5 text-xs text-red-700">
      <span className="text-sm leading-none">⚠</span>
      Urgent
    </span>
  );
}

function ColumnContainer({
  id,
  children,
  title,
  count,
}: {
  id: string;
  children: React.ReactNode;
  title: string;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[420px] rounded border p-3 ${
        isOver ? "border-zinc-700 bg-zinc-50" : "border-zinc-300 bg-zinc-100"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-700">{title}</p>
        <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SortableTaskCard({
  task,
  dragDisabled,
  onOpen,
  onRequestDelete,
}: {
  task: TaskData;
  dragDisabled: boolean;
  onOpen: () => void;
  onRequestDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: dragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-full rounded border border-zinc-300 bg-white p-3 text-left shadow-sm hover:border-zinc-500"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onOpen}>
          <p className="truncate text-sm font-medium text-zinc-900">{task.title}</p>
        </button>

        <div className="flex items-center gap-1">
          <span className={`rounded px-2 py-0.5 text-xs ${priorityBadgeClass(task.priority)}`}>
            P{task.priority}
          </span>
          <button
            type="button"
            className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs text-zinc-600 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onRequestDelete();
            }}
            aria-label={`Delete ${task.title}`}
          >
            X
          </button>
        </div>
      </div>

      <button type="button" className="mt-2 w-full text-left" onClick={onOpen}>
        <p className="text-xs text-zinc-600">Due: {formatDeadlineParis(task.deadline)}</p>

        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map((entry) => (
            <span
              key={entry.tag.id}
              className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-700"
            >
              {entry.tag.name}
            </span>
          ))}
        </div>

        {task.urgent ? (
          <div className="mt-2">
            <UrgentMarker />
          </div>
        ) : null}
      </button>
    </div>
  );
}

function TaskModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/35 px-6 py-10">
      <div className="max-h-full w-full max-w-3xl overflow-y-auto rounded border border-zinc-400 bg-zinc-50 p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-zinc-400 px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-200"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmDeleteModal({
  taskTitle,
  onCancel,
  onConfirm,
  isDeleting,
  error,
}: {
  taskTitle: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  error: string | null;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/45 px-6 py-10">
      <div className="w-full max-w-md rounded border border-zinc-400 bg-zinc-50 p-5 shadow-lg">
        <h3 className="text-base font-semibold text-zinc-900">Delete task permanently?</h3>
        <p className="mt-2 text-sm text-zinc-700">
          This will permanently delete <span className="font-medium">{taskTitle}</span>. This action
          cannot be undone.
        </p>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded border border-zinc-400 px-3 py-1.5 text-sm hover:bg-zinc-200 disabled:opacity-70"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isDeleting}
            className="rounded border border-red-500 bg-red-600 px-3 py-1.5 text-sm text-zinc-50 hover:bg-red-700 disabled:opacity-70"
          >
            {isDeleting ? "Deleting..." : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewTaskModal({
  pillarId,
  tags,
  onClose,
  onCreated,
}: {
  pillarId: string;
  tags: TagOption[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState(1);
  const [urgent, setUrgent] = useState(false);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate() {
    setError(null);
    if (!title || !deadline || !priority) {
      setError("Title, deadline, and priority are required.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pillarId,
          title,
          description: description || undefined,
          deadline: toParisIso(deadline),
          priority,
          urgent,
          tagIds,
        }),
      });

      if (!response.ok) {
        setError("Unable to create task.");
        return;
      }

      await onCreated();
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <TaskModal title="New Task" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Title *</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">Deadline *</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Priority *</label>
            <select
              value={priority}
              onChange={(event) => setPriority(Number(event.target.value))}
              className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2"
            >
              <option value={1}>1 (highest)</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={urgent}
                onChange={(event) => setUrgent(event.target.checked)}
              />
              Mark as urgent
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Tags / Themes</label>
          <div className="mt-2 grid grid-cols-2 gap-2 rounded border border-zinc-300 bg-white p-3">
            {tags.map((tag) => {
              const checked = tagIds.includes(tag.id);

              return (
                <label key={tag.id} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      setTagIds((previous) => {
                        if (event.target.checked) {
                          return [...previous, tag.id];
                        }
                        return previous.filter((value) => value !== tag.id);
                      });
                    }}
                  />
                  {tag.name}
                </label>
              );
            })}
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-zinc-400 px-3 py-1.5 text-sm hover:bg-zinc-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSaving}
            className="rounded border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-50 hover:bg-zinc-800 disabled:opacity-70"
          >
            {isSaving ? "Creating..." : "Create task"}
          </button>
        </div>
      </div>
    </TaskModal>
  );
}

function TaskDetailModal({
  task,
  tags,
  onClose,
  onRefresh,
  onRequestDelete,
}: {
  task: TaskData;
  tags: TagOption[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onRequestDelete: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [deadline, setDeadline] = useState(fromParisIsoForInput(task.deadline));
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [urgent, setUrgent] = useState(task.urgent);
  const [tagIds, setTagIds] = useState(task.tags.map((entry) => entry.tagId));

  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newItemTextBySection, setNewItemTextBySection] = useState<Record<string, string>>({});
  const [attachmentTitle, setAttachmentTitle] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setDeadline(fromParisIsoForInput(task.deadline));
    setPriority(task.priority);
    setStatus(task.status);
    setUrgent(task.urgent);
    setTagIds(task.tags.map((entry) => entry.tagId));
  }, [task]);

  async function saveTask() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          deadline: toParisIso(deadline),
          priority,
          status,
          urgent,
          tagIds,
        }),
      });

      if (!response.ok) {
        setError("Unable to save task details.");
        return;
      }

      await onRefresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function addSection() {
    if (!newSectionTitle.trim()) return;

    await fetch("/api/checklist/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: task.id,
        title: newSectionTitle.trim(),
      }),
    });

    setNewSectionTitle("");
    await onRefresh();
  }

  async function updateSectionTitle(sectionId: string, value: string) {
    await fetch(`/api/checklist/sections/${sectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: value }),
    });

    await onRefresh();
  }

  async function removeSection(sectionId: string) {
    await fetch(`/api/checklist/sections/${sectionId}`, {
      method: "DELETE",
    });
    await onRefresh();
  }

  async function addItem(sectionId: string) {
    const text = newItemTextBySection[sectionId]?.trim();
    if (!text) return;

    await fetch("/api/checklist/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId,
        text,
      }),
    });

    setNewItemTextBySection((previous) => ({
      ...previous,
      [sectionId]: "",
    }));

    await onRefresh();
  }

  async function toggleItem(itemId: string, isDone: boolean) {
    await fetch(`/api/checklist/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone }),
    });

    await onRefresh();
  }

  async function updateItemText(itemId: string, text: string) {
    await fetch(`/api/checklist/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    await onRefresh();
  }

  async function removeItem(itemId: string) {
    await fetch(`/api/checklist/items/${itemId}`, {
      method: "DELETE",
    });

    await onRefresh();
  }

  async function addAttachment() {
    if (!attachmentTitle.trim() || !attachmentUrl.trim()) return;

    const response = await fetch("/api/attachments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: task.id,
        title: attachmentTitle.trim(),
        url: attachmentUrl.trim(),
      }),
    });

    if (!response.ok) {
      setError("Attachment URL is invalid.");
      return;
    }

    setAttachmentTitle("");
    setAttachmentUrl("");
    await onRefresh();
  }

  async function removeAttachment(id: string) {
    await fetch(`/api/attachments/${id}`, {
      method: "DELETE",
    });

    await onRefresh();
  }

  return (
    <TaskModal title={`Task: ${task.title}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as TaskStatus)}
              className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2"
            >
              <option value={TaskStatus.NEW}>New</option>
              <option value={TaskStatus.DOING}>Doing</option>
              <option value={TaskStatus.DONE}>Done</option>
              <option value={TaskStatus.ARCHIVED}>Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Priority</label>
            <select
              value={priority}
              onChange={(event) => setPriority(Number(event.target.value))}
              className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-end">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={urgent}
                onChange={(event) => setUrgent(event.target.checked)}
              />
              Urgent
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Tags / Themes</label>
          <div className="mt-2 grid grid-cols-2 gap-2 rounded border border-zinc-300 bg-white p-3">
            {tags.map((tag) => (
              <label key={tag.id} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={tagIds.includes(tag.id)}
                  onChange={(event) => {
                    setTagIds((previous) => {
                      if (event.target.checked) {
                        return [...previous, tag.id];
                      }
                      return previous.filter((value) => value !== tag.id);
                    });
                  }}
                />
                {tag.name}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded border border-zinc-300 bg-white p-4">
          <p className="text-sm font-semibold">Checklist Sections</p>

          <div className="mt-3 space-y-3">
            {task.checklistSections.map((section) => (
              <div key={section.id} className="rounded border border-zinc-300 bg-zinc-50 p-3">
                <div className="flex items-center gap-2">
                  <input
                    defaultValue={section.title}
                    onBlur={(event) => updateSectionTitle(section.id, event.target.value)}
                    className="flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeSection(section.id)}
                    className="rounded border border-zinc-400 px-2 py-1 text-xs hover:bg-zinc-200"
                  >
                    Delete section
                  </button>
                </div>

                <ul className="mt-2 space-y-2">
                  {section.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.isDone}
                        onChange={(event) => toggleItem(item.id, event.target.checked)}
                      />
                      <input
                        defaultValue={item.text}
                        onBlur={(event) => updateItemText(item.id, event.target.value)}
                        className="flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded border border-zinc-400 px-2 py-1 text-xs hover:bg-zinc-200"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex gap-2">
                  <input
                    value={newItemTextBySection[section.id] ?? ""}
                    onChange={(event) =>
                      setNewItemTextBySection((previous) => ({
                        ...previous,
                        [section.id]: event.target.value,
                      }))
                    }
                    placeholder="New checklist item"
                    className="flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => addItem(section.id)}
                    className="rounded border border-zinc-900 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 hover:bg-zinc-800"
                  >
                    Add item
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={newSectionTitle}
              onChange={(event) => setNewSectionTitle(event.target.value)}
              placeholder="New section title"
              className="flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={addSection}
              className="rounded border border-zinc-900 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 hover:bg-zinc-800"
            >
              Add section
            </button>
          </div>
        </div>

        <div className="rounded border border-zinc-300 bg-white p-4">
          <p className="text-sm font-semibold">Attachment links</p>
          <ul className="mt-2 space-y-2">
            {task.attachments.map((attachment) => (
              <li key={attachment.id} className="flex items-center justify-between gap-2 text-sm">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-zinc-800 underline"
                >
                  {attachment.title}
                </a>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  className="rounded border border-zinc-400 px-2 py-1 text-xs hover:bg-zinc-200"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <input
              value={attachmentTitle}
              onChange={(event) => setAttachmentTitle(event.target.value)}
              placeholder="Link title"
              className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm"
            />
            <input
              value={attachmentUrl}
              onChange={(event) => setAttachmentUrl(event.target.value)}
              placeholder="https://..."
              className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={addAttachment}
              className="rounded border border-zinc-900 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 hover:bg-zinc-800"
            >
              Add link
            </button>
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onRequestDelete}
            className="rounded border border-red-400 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
          >
            Delete task
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-zinc-400 px-3 py-1.5 text-sm hover:bg-zinc-200"
            >
              Close
            </button>
            <button
              type="button"
              onClick={saveTask}
              disabled={isSaving}
              className="rounded border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-800 disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </TaskModal>
  );
}

export function PillarBoard({ pillar, initialTasks, tags }: PillarBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [taskPendingDelete, setTaskPendingDelete] = useState<TaskData | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  async function refreshData() {
    const response = await fetch(`/api/pillars/${pillar.slug}/tasks`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();

    const normalizedTasks = (payload.tasks as TaskData[]).map((task) => ({
      ...task,
      deadline: new Date(task.deadline).toISOString(),
    }));

    setTasks(normalizedTasks);
  }

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );

  function openDeleteConfirmation(task: TaskData) {
    setTaskPendingDelete(task);
    setDeleteError(null);
  }

  function closeDeleteConfirmation() {
    if (isDeletingTask) return;
    setTaskPendingDelete(null);
    setDeleteError(null);
  }

  async function confirmDeleteTask() {
    if (!taskPendingDelete) return;

    setIsDeletingTask(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/tasks/${taskPendingDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setDeleteError(payload?.error ?? "Unable to delete task.");
        return;
      }

      const deletedId = taskPendingDelete.id;
      setTaskPendingDelete(null);

      if (selectedTaskId === deletedId) {
        setSelectedTaskId(null);
      }

      await refreshData();
    } catch {
      setDeleteError("Unable to delete task.");
    } finally {
      setIsDeletingTask(false);
    }
  }

  function tasksForStatus(status: TaskStatus): TaskData[] {
    return sortTasks(
      tasks.filter((task) => task.status === status),
      sortMode,
    );
  }

  async function persistStatusOrder(status: TaskStatus, ids: string[]) {
    await fetch("/api/tasks/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        orderedTaskIds: ids,
      }),
    });
  }

  function applyOrders(
    previousTasks: TaskData[],
    status: TaskStatus,
    orderedIds: string[],
  ): TaskData[] {
    const indexById = new Map(orderedIds.map((id, index) => [id, index]));

    return previousTasks.map((task) => {
      if (!indexById.has(task.id)) {
        return task;
      }

      return {
        ...task,
        status,
        orderIndex: indexById.get(task.id) ?? task.orderIndex,
      };
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (sortMode !== "manual") {
      return;
    }

    const activeId = String(event.active.id);
    const overIdRaw = event.over?.id;

    if (!overIdRaw) {
      return;
    }

    const overId = String(overIdRaw);

    const activeTask = tasks.find((task) => task.id === activeId);
    if (!activeTask) {
      return;
    }

    const sourceStatus = activeTask.status;

    let targetStatus: TaskStatus | null = columnIdToStatus(overId);
    let targetIndex = 0;

    if (!targetStatus) {
      const overTask = tasks.find((task) => task.id === overId);
      if (!overTask) {
        return;
      }
      targetStatus = overTask.status;
    }

    const sourceIds = tasksForStatus(sourceStatus).map((task) => task.id);
    const targetIds = tasksForStatus(targetStatus).map((task) => task.id);

    if (sourceStatus === targetStatus) {
      const oldIndex = sourceIds.indexOf(activeId);
      const overTaskIndex = targetIds.indexOf(overId);
      const overIsColumn = overId.startsWith("column-");
      const newIndex = overIsColumn ? targetIds.length - 1 : overTaskIndex;

      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        return;
      }

      const reordered = arrayMove(sourceIds, oldIndex, newIndex);
      const next = applyOrders(tasks, sourceStatus, reordered);
      setTasks(next);

      setIsSyncing(true);
      try {
        await persistStatusOrder(sourceStatus, reordered);
      } finally {
        setIsSyncing(false);
      }

      return;
    }

    const filteredSource = sourceIds.filter((id) => id !== activeId);
    const overIsColumn = overId.startsWith("column-");
    targetIndex = overIsColumn ? targetIds.length : Math.max(0, targetIds.indexOf(overId));

    const updatedTarget = [...targetIds];
    updatedTarget.splice(targetIndex, 0, activeId);

    let nextTasks = applyOrders(tasks, sourceStatus, filteredSource);
    nextTasks = applyOrders(nextTasks, targetStatus, updatedTarget);

    setTasks(nextTasks);

    setIsSyncing(true);
    try {
      await fetch(`/api/tasks/${activeId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          orderIndex: targetIndex,
        }),
      });

      await Promise.all([
        persistStatusOrder(sourceStatus, filteredSource),
        persistStatusOrder(targetStatus, updatedTarget),
      ]);
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{pillar.name}</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Drag cards across New, Doing, Done, and Archived. Deadline and priority are required.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-600" htmlFor="sortMode">
            Sort
          </label>
          <select
            id="sortMode"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="rounded border border-zinc-400 bg-white px-2 py-1 text-sm"
          >
            <option value="manual">Manual (drag enabled)</option>
            <option value="priority">Priority</option>
            <option value="deadline">Deadline</option>
          </select>

          <button
            type="button"
            onClick={() => setIsNewTaskOpen(true)}
            className="rounded border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-800"
          >
            New task
          </button>
        </div>
      </div>

      {sortMode !== "manual" ? (
        <p className="rounded border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          Drag and drop is disabled while sorting by {sortMode}. Switch back to Manual to reorder.
        </p>
      ) : null}

      {isSyncing ? (
        <p className="text-xs text-zinc-500">Syncing board updates...</p>
      ) : null}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          {STATUS_COLUMNS.map((column) => {
            const columnTasks = tasksForStatus(column.status);
            return (
              <ColumnContainer
                key={column.status}
                id={statusToColumnId(column.status)}
                title={column.label}
                count={columnTasks.length}
              >
                <SortableContext
                  items={columnTasks.map((task) => task.id)}
                  strategy={rectSortingStrategy}
                >
                  {columnTasks.map((task) => (
                    <SortableTaskCard
                      key={task.id}
                      task={task}
                      dragDisabled={sortMode !== "manual"}
                      onOpen={() => setSelectedTaskId(task.id)}
                      onRequestDelete={() => openDeleteConfirmation(task)}
                    />
                  ))}
                </SortableContext>
              </ColumnContainer>
            );
          })}
        </div>
      </DndContext>

      {isNewTaskOpen ? (
        <NewTaskModal
          pillarId={pillar.id}
          tags={tags}
          onClose={() => setIsNewTaskOpen(false)}
          onCreated={refreshData}
        />
      ) : null}

      {selectedTask ? (
        <TaskDetailModal
          task={selectedTask}
          tags={tags}
          onClose={() => setSelectedTaskId(null)}
          onRefresh={refreshData}
          onRequestDelete={() => openDeleteConfirmation(selectedTask)}
        />
      ) : null}

      {taskPendingDelete ? (
        <ConfirmDeleteModal
          taskTitle={taskPendingDelete.title}
          onCancel={closeDeleteConfirmation}
          onConfirm={confirmDeleteTask}
          isDeleting={isDeletingTask}
          error={deleteError}
        />
      ) : null}
    </div>
  );
}
