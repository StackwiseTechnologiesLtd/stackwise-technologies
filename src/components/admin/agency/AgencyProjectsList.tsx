"use client";

import {
  agencyProjectStatusLabels,
  type AgencyProject,
} from "@/lib/agency/types";
import { formatShortRelativeTime } from "@/lib/format-relative-time";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import Link from "next/link";
import { useCallback, useState } from "react";

export function AgencyProjectsList() {
  const [projects, setProjects] = useState<AgencyProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/projects");
      if (!res.ok) throw new Error("Could not load projects");
      const json = (await res.json()) as { projects: AgencyProject[] };
      setProjects(json.projects);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  if (loading && projects.length === 0) {
    return <p className="text-sm text-muted">Loading projects…</p>;
  }

  if (error) {
    return <p className="text-sm text-[var(--admin-warn)]">{error}</p>;
  }

  if (projects.length === 0) {
    return (
      <p className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 text-sm text-muted">
        No delivery projects yet. Mark a CRM opportunity as{" "}
        <strong className="text-foreground">Won</strong> to create one automatically,
        or open a won deal and start a project from there.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--admin-border)]">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead className="bg-[var(--admin-canvas)] text-[10px] font-semibold uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--admin-border)] bg-[var(--admin-surface)]">
          {projects.map((p) => (
            <tr key={p.id} className="hover:bg-[var(--admin-nav-hover)]">
              <td className="px-4 py-3">
                <Link
                  href={`/admin/projects/${p.id}`}
                  className="font-medium text-accent hover:underline"
                >
                  {p.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted">{p.clientName}</td>
              <td className="px-4 py-3 text-muted">
                {agencyProjectStatusLabels[p.status]}
              </td>
              <td className="px-4 py-3 tabular-nums text-muted">
                {formatShortRelativeTime(p.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}