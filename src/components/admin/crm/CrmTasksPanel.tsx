"use client";

import { StackwiseDatePicker, StackwiseTimePicker } from "@/components/stackwise";
import { buildLocalIsoFromDateAndTime } from "@/lib/calendar/datetime";
import { ADMIN_INPUT } from "@/lib/ui/admin";
import type { CrmTask } from "@/lib/crm/types";
import { useState } from "react";

function formatDue(iso: string | null): string {
  if (!iso) return "No due date";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function CrmTasksPanel({
  opportunityId,
  tasks,
  onChange,
}: {
  opportunityId: string;
  tasks: CrmTask[];
  onChange: () => void;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addTask() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/crm/opportunities/${opportunityId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmed,
          dueAt: buildLocalIsoFromDateAndTime(dueDate, dueTime),
        }),
      });
      if (!res.ok) throw new Error("Could not add task");
      setTitle("");
      setDueDate("");
      setDueTime("");
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Add failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(task: CrmTask) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/crm/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completedAt }),
      });
      if (!res.ok) throw new Error("Could not update task");
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  const open = tasks.filter((t) => !t.completedAt);
  const done = tasks.filter((t) => t.completedAt);

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Tasks</h3>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="text-[10px] font-semibold uppercase text-muted">
            Title
          </label>
          <input
            type="text"
            className={`${ADMIN_INPUT} mt-1`}
            placeholder="Follow up on proposal"
            value={title}
            disabled={busy}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void addTask();
            }}
          />
        </div>
        <div className="grid min-w-0 gap-2 sm:grid-cols-2 sm:w-72">
          <div>
            <label className="text-[10px] font-semibold uppercase text-muted">
              Due date
            </label>
            <div className="mt-1">
              <StackwiseDatePicker
                value={dueDate}
                onChange={setDueDate}
                placeholder="Optional"
                className={busy ? "pointer-events-none opacity-50" : ""}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase text-muted">
              Due time
            </label>
            <div className="mt-1">
              <StackwiseTimePicker
                value={dueTime}
                onChange={setDueTime}
                placeholder="Optional"
                className={busy ? "pointer-events-none opacity-50" : ""}
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          disabled={busy || !title.trim()}
          onClick={() => void addTask()}
          className="shrink-0 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm font-medium hover:bg-[var(--admin-surface-hover)] disabled:opacity-50"
        >
          Add task
        </button>
      </div>
      {error ? <p className="text-xs text-[var(--admin-warn)]">{error}</p> : null}

      {open.length === 0 && done.length === 0 ? (
        <p className="text-sm text-muted">No tasks yet.</p>
      ) : (
        <ul className="divide-y divide-[var(--admin-border)] rounded-lg border border-[var(--admin-border)]">
          {open.map((task) => (
            <li
              key={task.id}
              className="flex items-start gap-3 px-3 py-2.5 text-sm"
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={false}
                disabled={busy}
                onChange={() => void toggleTask(task)}
                aria-label={`Mark done: ${task.title}`}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{task.title}</p>
                <p className="text-xs text-muted">{formatDue(task.dueAt)}</p>
              </div>
            </li>
          ))}
          {done.map((task) => (
            <li
              key={task.id}
              className="flex items-start gap-3 px-3 py-2.5 text-sm opacity-70"
            >
              <input
                type="checkbox"
                className="mt-1"
                checked
                disabled={busy}
                onChange={() => void toggleTask(task)}
                aria-label={`Mark open: ${task.title}`}
              />
              <div className="min-w-0 flex-1">
                <p className="line-through text-muted">{task.title}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}