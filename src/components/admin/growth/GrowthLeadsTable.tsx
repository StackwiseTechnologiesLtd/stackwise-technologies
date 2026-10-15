"use client";

import { useToast } from "@/components/ToastProvider";
import type { GrowthLead, PipelineStatus } from "@/lib/growth/types";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import {
  GrowthScoreFilter,
  scoreBadgeClass,
} from "@/components/admin/growth/GrowthScoreFilter";
import { growthFetch } from "@/lib/growth/growth-fetch";
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
  const [minScore, setMinScore] = useState(0);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      else setRefreshing(true);
      try {
        const qs = minScore > 0 ? `?minScore=${minScore}` : "";
        const res = await growthFetch(`/api/admin/growth/leads${qs}`);
        if (!res.ok) throw new Error("Failed to load leads");
        const json = (await res.json()) as { leads: GrowthLead[] };
        setLeads(json.leads);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Load failed");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast, minScore],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, pipelineStatus: PipelineStatus) {
    setUpdatingId(id);
    try {
      const res = await growthFetch(`/api/admin/growth/leads/${id}`, {
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <GrowthScoreFilter minScore={minScore} onChange={setMinScore} />
        <AdminActionButton
          busy={refreshing}
          busyLabel="Refreshing…"
          onClick={() => void load({ silent: true })}
        >
          Refresh
        </AdminActionButton>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-line bg-panel/80 p-10 text-center text-sm text-muted">
          No leads match this score filter.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-panel/50">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-line bg-black/30 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Fit</th>
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Platform</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-line/60 last:border-0 hover:bg-black/20"
                  >
                    <td className="px-4 py-4 align-top">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ring-1 ${scoreBadgeClass(lead.compositeScore)}`}
                      >
                        {lead.compositeScore}%
                      </span>
                      <p className="mt-1 text-[10px] text-muted">
                        ICP {lead.icpScore} · intent {lead.intentScore}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="font-medium text-foreground">{lead.fullName}</p>
                      {lead.roleTitle ? (
                        <p className="text-xs text-muted">{lead.roleTitle}</p>
                      ) : null}
                      {lead.companyName ? (
                        <p className="text-xs text-muted">{lead.companyName}</p>
                      ) : null}
                      {lead.profileUrl ? (
                        <a
                          href={lead.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs text-accent hover:underline"
                        >
                          Profile
                        </a>
                      ) : null}
                      {lead.profileSummary ? (
                        <p className="mt-2 line-clamp-2 text-xs text-muted">
                          {lead.profileSummary.slice(0, 160)}
                          {lead.profileSummary.length > 160 ? "…" : ""}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top capitalize text-muted">
                      {lead.platform ?? "n/a"}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <select
                        className="rounded-lg border border-line bg-black/50 px-2 py-1.5 text-xs disabled:opacity-60"
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
      )}
    </div>
  );
}
