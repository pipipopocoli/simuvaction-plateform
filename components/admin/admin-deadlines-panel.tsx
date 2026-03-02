"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Deadline = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  isGlobal: boolean;
  createdBy: { name: string; role: string };
};

function toDateTimeLocalValue(isoValue: string) {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function addDays(isoValue: string, days: number) {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) {
    return isoValue;
  }
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function AdminDeadlinesPanel() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [isGlobal, setIsGlobal] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editIsGlobal, setEditIsGlobal] = useState(true);
  const [isEditingPending, setIsEditingPending] = useState(false);

  const [calendarFrom, setCalendarFrom] = useState("");
  const [calendarTo, setCalendarTo] = useState("");
  const [calendarDeadlines, setCalendarDeadlines] = useState<Deadline[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  const todayLocal = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(now.getDate() - 30);
    const to = new Date(now);
    to.setDate(now.getDate() + 120);
    setCalendarFrom(from.toISOString().slice(0, 10));
    setCalendarTo(to.toISOString().slice(0, 10));
    void fetchDeadlines();
  }, []);

  async function fetchDeadlines() {
    try {
      const res = await fetch("/api/admin/deadlines");
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as Deadline[];
      setDeadlines(data);
      setCalendarDeadlines(data);
    } catch (fetchError) {
      console.error(fetchError);
    }
  }

  async function fetchCalendarDeadlines() {
    setIsLoadingCalendar(true);
    try {
      const params = new URLSearchParams();
      if (calendarFrom) {
        params.set("from", `${calendarFrom}T00:00:00.000Z`);
      }
      if (calendarTo) {
        params.set("to", `${calendarTo}T23:59:59.999Z`);
      }
      const res = await fetch(`/api/admin/deadlines/calendar?${params.toString()}`);
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Unable to load calendar deadlines.");
        return;
      }
      const payload = (await res.json()) as { deadlines: Deadline[] };
      setCalendarDeadlines(payload.deadlines);
    } catch (fetchError) {
      console.error(fetchError);
      setError("A network error occurred.");
    } finally {
      setIsLoadingCalendar(false);
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
        body: JSON.stringify({ title, description, date, isGlobal }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Failed to add deadline.");
      } else {
        setTitle("");
        setDescription("");
        setDate("");
        setIsGlobal(true);
        await fetchDeadlines();
      }
    } catch {
      setError("A network error occurred.");
    } finally {
      setIsPending(false);
    }
  }

  function startEdit(deadline: Deadline) {
    setEditingId(deadline.id);
    setEditTitle(deadline.title);
    setEditDescription(deadline.description ?? "");
    setEditDate(toDateTimeLocalValue(deadline.date));
    setEditIsGlobal(deadline.isGlobal);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditDate("");
    setEditIsGlobal(true);
  }

  async function saveEdit() {
    if (!editingId) {
      return;
    }

    setIsEditingPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/deadlines/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription || null,
          date: editDate ? new Date(editDate).toISOString() : undefined,
          isGlobal: editIsGlobal,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Failed to update deadline.");
        return;
      }

      cancelEdit();
      await fetchDeadlines();
      await fetchCalendarDeadlines();
    } catch {
      setError("A network error occurred.");
    } finally {
      setIsEditingPending(false);
    }
  }

  async function handleMoveDeadline(id: string, currentDateIso: string, dayDelta: number) {
    setError(null);
    try {
      const res = await fetch("/api/admin/deadlines/calendar/move", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          date: addDays(currentDateIso, dayDelta),
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Failed to move deadline.");
        return;
      }
      await fetchDeadlines();
      await fetchCalendarDeadlines();
    } catch {
      setError("A network error occurred.");
    }
  }

  async function handleDeleteDeadline(id: string) {
    if (!confirm("Are you sure you want to delete this deadline?")) return;
    try {
      const res = await fetch(`/api/admin/deadlines?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchDeadlines();
        await fetchCalendarDeadlines();
      }
    } catch (deleteError) {
      console.error(deleteError);
    }
  }

  return (
    <div className="rounded border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-serif font-bold text-[#111827]">Official Deadlines</h2>

      <form onSubmit={handleAddDeadline} className="mb-6 rounded border border-[#E5E7EB] bg-[#FFFBF5] p-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-500">Add New Deadline</h3>
        <div className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded border-zinc-300 p-2 text-sm"
              placeholder="e.g. Resolution Drafts Due"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700">Date & Time</label>
            <input
              type="datetime-local"
              value={date}
              min={`${todayLocal}T00:00`}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded border-zinc-300 p-2 text-sm"
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-xs font-semibold text-zinc-700">Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border-zinc-300 p-2 text-sm"
            placeholder="Brief details..."
          />
        </div>

        <label className="mb-3 inline-flex items-center gap-2 text-xs font-semibold text-zinc-700">
          <input
            type="checkbox"
            checked={isGlobal}
            onChange={(e) => setIsGlobal(e.target.checked)}
            className="h-4 w-4"
          />
          Visible to all teams
        </label>

        {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-[#1E3A8A] px-4 py-2 text-xs font-bold uppercase text-white transition-colors hover:bg-blue-900"
        >
          {isPending ? "Adding..." : "Publish Deadline"}
        </button>
      </form>

      <div className="mb-6 rounded border border-zinc-200 p-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-500">Calendar Window</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            type="date"
            value={calendarFrom}
            onChange={(e) => setCalendarFrom(e.target.value)}
            className="rounded border-zinc-300 p-2 text-sm"
          />
          <input
            type="date"
            value={calendarTo}
            onChange={(e) => setCalendarTo(e.target.value)}
            className="rounded border-zinc-300 p-2 text-sm"
          />
          <button
            type="button"
            onClick={fetchCalendarDeadlines}
            disabled={isLoadingCalendar}
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            {isLoadingCalendar ? "Loading..." : "Load Calendar Deadlines"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {calendarDeadlines.length === 0 ? (
          <p className="text-sm italic text-zinc-500">No official deadlines scheduled in this range.</p>
        ) : (
          calendarDeadlines.map((deadline) => (
            <div key={deadline.id} className="rounded border border-zinc-200 p-3">
              {editingId === deadline.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded border-zinc-300 p-2 text-sm"
                  />
                  <input
                    type="datetime-local"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded border-zinc-300 p-2 text-sm"
                  />
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full rounded border-zinc-300 p-2 text-sm"
                    placeholder="Description"
                  />
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700">
                    <input
                      type="checkbox"
                      checked={editIsGlobal}
                      onChange={(e) => setEditIsGlobal(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Visible to all teams
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isEditingPending}
                      onClick={saveEdit}
                      className="rounded bg-[#1E3A8A] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      {isEditingPending ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">{deadline.title}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(deadline.date).toLocaleString()} • Added by {deadline.createdBy?.name}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">
                      {deadline.isGlobal ? "GLOBAL" : "TARGETED"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleMoveDeadline(deadline.id, deadline.date, -1)}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                    >
                      -1 day
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDeadline(deadline.id, deadline.date, 1)}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                    >
                      +1 day
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(deadline)}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDeadline(deadline.id)}
                      className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
