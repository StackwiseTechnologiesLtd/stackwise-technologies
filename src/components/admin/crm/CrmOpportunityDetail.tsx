"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { CrmActivityTimeline } from "@/components/admin/crm/CrmActivityTimeline";
import { GrowthArticleLink } from "@/components/admin/growth/GrowthArticleLink";
import { leadSourceBadgeLabel } from "@/components/admin/growth/GrowthLeadSourceFilter";
import { formatShortRelativeTime } from "@/lib/format-relative-time";
import { crmStageLabels, type CrmOpportunityDetail } from "@/lib/crm/types";
import { pipelineStatuses, type PipelineStatus } from "@/lib/growth/types";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import Link from "next/link";
import { useCallback, useState } from "react";

export function CrmOpportunityDetailPanel({ opportunityId }: { opportunityId: string }) {
  const [detail, setDetail] = useState<CrmOpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageBusy, setStageBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/crm/opportunities/${opportunityId}`);
      if (!res.ok) throw new Error("Not found");
      setDetail((await res.json()) as CrmOpportunityDetail);
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  async function setStage(stage: PipelineStatus) {
    setStageBusy(true);
    try {
      const res = await fetch(`/api/admin/crm/opportunities/${opportunityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error("Update failed");
      setDetail((await res.json()) as CrmOpportunityDetail);
    } finally {
      setStageBusy(false);
    }
  }

  if (loading && !detail) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  if (!detail) {
    return <p className="text-sm text-muted">Opportunity not found.</p>;
  }

  const { opportunity, person, company, activities } = detail;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-full flex-1">
          <Link href="/admin/crm" className="text-xs text-accent hover:underline">
            ← Pipeline
          </Link>
          <h2 className="mt-2 break-words text-xl font-semibold tracking-tight">
            {opportunity.name}
          </h2>
          <p className="break-words text-sm text-muted">
            {person.fullName}
            {person.roleTitle ? ` · ${person.roleTitle}` : ""}
            {company ? ` · ${company.name}` : ""}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-panel/60 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase text-muted">Stage</p>
          <select
            className="mt-1 block rounded-lg border border-line bg-black/50 px-2 py-1.5 text-sm disabled:opacity-60"
            value={opportunity.stage}
            disabled={stageBusy}
            onChange={(e) => void setStage(e.target.value as PipelineStatus)}
          >
            {pipelineStatuses.map((s) => (
              <option key={s} value={s}>{crmStageLabels[s]}</option>
            ))}
          </select>
          <p className="mt-2 truncate text-xs text-muted">
            {[
              formatShortRelativeTime(opportunity.updatedAt),
              opportunity.leadSource
                ? leadSourceBadgeLabel(opportunity.leadSource)
                : null,
              `${opportunity.fitScore}% fit`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap gap-3 text-sm">
        {opportunity.sourcePostUrl ? (
          <GrowthArticleLink
            href={opportunity.sourcePostUrl}
            platform={opportunity.platform}
          />
        ) : null}
        {person.linkedinUrl ? (
          <a
            href={person.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            LinkedIn
          </a>
        ) : null}
        {person.xProfileUrl ? (
          <a
            href={person.xProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            X profile
          </a>
        ) : null}
        {opportunity.growthLeadId ? (
          <Link
            href="/admin/growth"
            className="text-accent hover:underline"
          >
            Growth inbox
          </Link>
        ) : null}
      </div>

      <section>
        <h3 className="text-sm font-semibold">Activity</h3>
        <div className="mt-3">
          <CrmActivityTimeline
            opportunityId={opportunityId}
            activities={activities}
            onAdded={() => void load()}
          />
        </div>
      </section>

      <AdminActionButton onClick={() => void load()}>Refresh</AdminActionButton>
    </div>
  );
}
