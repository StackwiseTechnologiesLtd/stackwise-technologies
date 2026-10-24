"use client";

import { useToast } from "@/components/ToastProvider";
import type { GrowthLead, PipelineStatus } from "@/lib/growth/types";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import {
  GrowthPlatformFilter,
  type PlatformFilter,
} from "@/components/admin/growth/GrowthPlatformFilter";
import {
  GrowthScoreFilter,
  scoreBadgeClass,
} from "@/components/admin/growth/GrowthScoreFilter";
import { growthFetch } from "@/lib/growth/growth-fetch";
import { sortLeadsByCompositeScore } from "@/lib/growth/lead-sort";
import { GrowthArticleLink } from "@/components/admin/growth/GrowthArticleLink";
import Link from "next/link";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { useCallback, useState } from "react";

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

function leadsQuery(minScore: number, platform: PlatformFilter): string {
  const params = new URLSearchParams();
  if (minScore > 0) params.set("minScore", String(minScore));
  if (platform !== "all") params.set("platform", platform);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function GrowthLeadsTable() {
  const toast = useToast();
  const [leads, setLeads] = useState<GrowthLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0);
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      else setRefreshing(true);
      try {
        const res = await growthFetch(
          `/api/admin/growth/leads${leadsQuery(minScore, platform)}`,
        );
        if (!res.ok) throw new Error("Failed to load leads");
        const json = (await res.json()) as { leads: GrowthLead[] };
        setLeads(sortLeadsByCompositeScore(json.leads));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Load failed");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast, minScore, platform],
  );

  useDeferredEffect(() => {
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

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading leads…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <GrowthPlatformFilter value={platform} onChange={setPlatform} />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <GrowthScoreFilter minScore={minScore} onChange={setMinScore} />
            <p className="text-[11px] text-muted">Sorted by highest fit score first</p>
          </div>
          <AdminActionButton
            busy={refreshing}
            busyLabel="Refreshing…"
            onClick={() => void load({ silent: true })}
          >
            Refresh
          </AdminActionButton>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-line bg-panel/80 p-10 text-center text-sm text-muted">
          No leads match this filter.
        </div>
      ) : (
        <ul className="space-y-2">
          {leads.map((lead) => {
            const isOpen = expanded.has(lead.id);
            return (
              <li
                key={lead.id}
                className="overflow-hidden rounded-2xl border border-line bg-panel/50"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-4 p-4 text-left hover:bg-black/20"
                  onClick={() => toggleExpanded(lead.id)}
                  aria-expanded={isOpen}
                >
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ring-1 ${scoreBadgeClass(lead.compositeScore)}`}
                  >
                    {lead.compositeScore}%
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{lead.fullName}</p>
                    <p className="truncate text-xs text-muted">
                      {[lead.roleTitle, lead.companyName]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                    {lead.sourceUrl ? (
                      <p className="mt-1">
                        <GrowthArticleLink
                          href={lead.sourceUrl}
                          platform={lead.platform}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs capitalize text-muted">
                    {lead.platform ?? "n/a"}
                  </span>
                  <span className="shrink-0 text-muted" aria-hidden>
                    {isOpen ? "▾" : "▸"}
                  </span>
                </button>
                {isOpen ? (
                  <div className="border-t border-line px-4 pb-4 pt-3">
                    <p className="text-[10px] text-muted">
                      ICP {lead.icpScore} · intent {lead.intentScore}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {lead.sourceUrl ? (
                        <GrowthArticleLink
                          href={lead.sourceUrl}
                          platform={lead.platform}
                        />
                      ) : null}
                      {lead.profileUrl ? (
                        <a
                          href={lead.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline"
                        >
                          Profile
                        </a>
                      ) : null}
                    </div>
                    {lead.profileSummary ? (
                      <p className="mt-2 text-xs leading-relaxed text-muted">
                        {lead.profileSummary.slice(0, 320)}
                        {lead.profileSummary.length > 320 ? "…" : ""}
                      </p>
                    ) : null}
                    <Link
                      href={{
                        pathname: "/admin/contracts/new",
                        query: {
                          name: lead.fullName,
                          email: lead.email ?? "",
                          company: lead.companyName ?? "",
                          brief: lead.profileSummary ?? "",
                          leadId: lead.id,
                        },
                      }}
                      className="mt-3 inline-block text-xs font-medium text-accent hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Draft agreement with AI →
                    </Link>
                    <div className="mt-3">
                      <label className="text-[10px] font-medium uppercase text-muted">
                        Pipeline status
                      </label>
                      <select
                        className="mt-1 block w-full max-w-xs rounded-lg border border-line bg-black/50 px-2 py-1.5 text-xs disabled:opacity-60"
                        value={lead.pipelineStatus}
                        disabled={updatingId === lead.id}
                        onChange={(e) =>
                          void setStatus(lead.id, e.target.value as PipelineStatus)
                        }
                        onClick={(e) => e.stopPropagation()}
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
