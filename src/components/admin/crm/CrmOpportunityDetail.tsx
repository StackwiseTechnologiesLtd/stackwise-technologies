"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { CrmActivityTimeline } from "@/components/admin/crm/CrmActivityTimeline";
import { CrmTasksPanel } from "@/components/admin/crm/CrmTasksPanel";
import { GrowthArticleLink } from "@/components/admin/growth/GrowthArticleLink";
import { leadSourceBadgeLabel } from "@/components/admin/growth/GrowthLeadSourceFilter";
import { formatShortRelativeTime } from "@/lib/format-relative-time";
import { crmStageLabels, type CrmOpportunityDetail } from "@/lib/crm/types";
import { pipelineStatuses, type PipelineStatus } from "@/lib/growth/types";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import Link from "next/link";
import { StackwiseSelect } from "@/components/stackwise";
import {
  agencyProjectStatusLabels,
  type AgencyProject,
} from "@/lib/agency/types";
import { useCallback, useState } from "react";

export function CrmOpportunityDetailPanel({
  opportunityId,
  variant = "page",
  onStageChange,
}: {
  opportunityId: string;
  variant?: "page" | "modal";
  onStageChange?: () => void;
}) {
  const [detail, setDetail] = useState<CrmOpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageBusy, setStageBusy] = useState(false);
  const [deliveryProject, setDeliveryProject] = useState<AgencyProject | null>(
    null,
  );
  const [projectBusy, setProjectBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/crm/opportunities/${opportunityId}`);
      if (!res.ok) throw new Error("Not found");
      setDetail((await res.json()) as CrmOpportunityDetail);
      const projectRes = await fetch(
        `/api/admin/crm/opportunities/${opportunityId}/project`,
      );
      if (projectRes.ok) {
        const json = (await projectRes.json()) as { project: AgencyProject | null };
        setDeliveryProject(json.project);
      } else {
        setDeliveryProject(null);
      }
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  async function createDeliveryProject() {
    setProjectBusy(true);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId }),
      });
      if (!res.ok) throw new Error("Create failed");
      const json = (await res.json()) as { project: AgencyProject };
      setDeliveryProject(json.project);
    } finally {
      setProjectBusy(false);
    }
  }

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
      onStageChange?.();
      if (stage === "won") {
        const projectRes = await fetch(
          `/api/admin/crm/opportunities/${opportunityId}/project`,
        );
        if (projectRes.ok) {
          const json = (await projectRes.json()) as { project: AgencyProject | null };
          setDeliveryProject(json.project);
        }
      }
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

  const { opportunity, person, company, activities, tasks } = detail;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-full flex-1">
          {variant === "page" ? (
            <Link href="/admin/crm" className="text-xs text-accent hover:underline">
              ← Pipeline
            </Link>
          ) : null}
          <h2
            id={variant === "modal" ? "crm-opportunity-title" : undefined}
            className={`break-words text-xl font-semibold tracking-tight ${variant === "page" ? "mt-2" : ""}`}
          >
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
          <StackwiseSelect<PipelineStatus>
            aria-label="Pipeline stage"
            className="mt-1"
            value={opportunity.stage}
            disabled={stageBusy}
            onChange={(s) => void setStage(s)}
            options={pipelineStatuses.map((s) => ({
              value: s,
              label: crmStageLabels[s],
            }))}
          />
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
            href="/admin/growth/inbox"
            className="text-accent hover:underline"
          >
            Growth inbox
          </Link>
        ) : null}
      </div>

      {opportunity.stage === "won" ? (
        <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm">
          <p className="text-[10px] font-semibold uppercase text-muted">
            Delivery
          </p>
          {deliveryProject ? (
            <Link
              href={`/admin/projects/${deliveryProject.id}`}
              className="mt-1 inline-block font-medium text-accent hover:underline"
            >
              {deliveryProject.title} ·{" "}
              {agencyProjectStatusLabels[deliveryProject.status]}
            </Link>
          ) : (
            <button
              type="button"
              disabled={projectBusy}
              className="mt-2 text-accent hover:underline disabled:opacity-50"
              onClick={() => void createDeliveryProject()}
            >
              Start delivery project
            </button>
          )}
        </div>
      ) : null}

      <CrmTasksPanel
        opportunityId={opportunityId}
        tasks={tasks}
        onChange={() => {
          void load();
          onStageChange?.();
        }}
      />

      <section>
        <h3 className="text-sm font-semibold">Activity</h3>
        <div className="mt-3">
          <CrmActivityTimeline
            opportunityId={opportunityId}
            activities={activities}
            onAdded={() => {
              void load();
              onStageChange?.();
            }}
          />
        </div>
      </section>

      <AdminActionButton onClick={() => void load()}>Refresh</AdminActionButton>
    </div>
  );
}
