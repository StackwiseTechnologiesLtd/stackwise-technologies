"use client";

import {
  agencyProjectStatuses,
  agencyProjectStatusLabels,
  type AgencyProjectDetail,
  type AgencyProjectMilestone,
} from "@/lib/agency/types";
import { ADMIN_INPUT } from "@/lib/ui/admin";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import Link from "next/link";
import { StackwiseSelect } from "@/components/stackwise";
import { useCallback, useState } from "react";

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

export function AgencyProjectDetailPanel({ projectId }: { projectId: string }) {
  const [detail, setDetail] = useState<AgencyProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`);
      if (!res.ok) throw new Error("Not found");
      setDetail((await res.json()) as AgencyProjectDetail);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  async function patchProject(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Update failed");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function addMilestone() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmed,
          dueAt: dueAt.trim() ? new Date(dueAt).toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error("Could not add milestone");
      setTitle("");
      setDueAt("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function toggleMilestone(m: AgencyProjectMilestone) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/projects/milestones/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !m.completedAt }),
      });
      if (!res.ok) throw new Error("Update failed");
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading && !detail) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  if (!detail) {
    return <p className="text-sm text-muted">Project not found.</p>;
  }

  const { project, milestones } = detail;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/projects" className="text-xs text-accent hover:underline">
          ← Projects
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{project.title}</h1>
        <p className="text-sm text-muted">{project.clientName}</p>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase text-muted">Status</p>
          <StackwiseSelect
            aria-label="Project status"
            className="mt-1"
            value={project.status}
            disabled={busy}
            onChange={(status) => void patchProject({ status })}
            options={agencyProjectStatuses.map((s) => ({
              value: s,
              label: agencyProjectStatusLabels[s],
            }))}
          />
        </div>
        {project.crmOpportunityId ? (
          <Link
            href={`/admin/crm/opportunities/${project.crmOpportunityId}`}
            className="text-sm text-accent hover:underline"
          >
            CRM opportunity
          </Link>
        ) : null}
        {project.contractEngagementId ? (
          <Link
            href={`/admin/contracts/${project.contractEngagementId}`}
            className="text-sm text-accent hover:underline"
          >
            Agreement
          </Link>
        ) : null}
        {project.paymentLinkId ? (
          <Link
            href={`/admin/payment-links/${project.paymentLinkId}`}
            className="text-sm text-accent hover:underline"
          >
            Payment link
          </Link>
        ) : null}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Milestones</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="text-[10px] font-semibold uppercase text-muted">
              Title
            </label>
            <input
              className={`${ADMIN_INPUT} mt-1`}
              value={title}
              disabled={busy}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="sm:w-44">
            <label className="text-[10px] font-semibold uppercase text-muted">
              Due
            </label>
            <input
              type="datetime-local"
              className={`${ADMIN_INPUT} mt-1`}
              value={dueAt}
              disabled={busy}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={busy || !title.trim()}
            onClick={() => void addMilestone()}
            className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm font-medium hover:bg-[var(--admin-surface-hover)] disabled:opacity-50"
          >
            Add milestone
          </button>
        </div>

        {milestones.length === 0 ? (
          <p className="text-sm text-muted">No milestones yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)] rounded-lg border border-[var(--admin-border)]">
            {milestones.map((m) => (
              <li
                key={m.id}
                className={`flex items-start gap-3 px-3 py-2.5 text-sm ${
                  m.completedAt ? "opacity-60" : ""
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={Boolean(m.completedAt)}
                  disabled={busy}
                  onChange={() => void toggleMilestone(m)}
                  aria-label={`Complete ${m.title}`}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={
                      m.completedAt
                        ? "line-through text-muted"
                        : "font-medium text-foreground"
                    }
                  >
                    {m.title}
                  </p>
                  <p className="text-xs text-muted">{formatDue(m.dueAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}