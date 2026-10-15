"use client";

import { useToast } from "@/components/ToastProvider";
import type { GrowthLead, PipelineStatus } from "@/lib/growth/types";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { useCallback, useEffect, useState } from "react";

const statuses: PipelineStatus[] = [
  "new",
  "reviewed",
  "outreach",
  "replied",
  "booked",
  "won",
  "lost",
  "not_a_fit",
];

export function GrowthLeadsTable() {
  const toast = useToast();
  const [leads, setLeads] = useState<GrowthLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("/api/admin/growth/leads");
      if (!res.ok) throw new Error("Failed to load leads");
      const json = (await res.json()) as { leads: GrowthLead[] };
      setLeads(json.leads);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, pipelineStatus: PipelineStatus) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/growth/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineStatus }),
      });
      if (!res.ok) {
        toast.error("Could not update lead");
        return;
      }
      await load({ silent: true });
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading leads…</p>;
  }

  return (
    <div className="space-y-4">
      <AdminActionButton
        busy={refreshing}
        busyLabel="Refreshing…"
        onClick={() => void load({ silent: true })}
      >
        Refresh
      </AdminActionButton>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Fit</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Platform</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-line/80 last:border-0">
                <td className="px-4 py-3 font-mono text-accent">
                  {lead.compositeScore}%
                </td>
                <td className="px-4 py-3 font-medium">{lead.fullName}</td>
                <td className="px-4 py-3 text-muted">{lead.roleTitle ?? "n/a"}</td>
                <td className="px-4 py-3 capitalize">{lead.platform ?? "n/a"}</td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-md border border-line bg-black/50 px-2 py-1 text-xs disabled:opacity-60"
                    value={lead.pipelineStatus}
                    disabled={updatingId === lead.id}
                    onChange={(e) =>
                      void setStatus(lead.id, e.target.value as PipelineStatus)
                    }
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
