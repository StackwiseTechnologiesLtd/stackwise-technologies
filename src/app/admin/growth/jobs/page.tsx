"use client";

import { GrowthCrmPipelineBanner } from "@/components/admin/growth/GrowthCrmPipelineBanner";
import { GrowthInboxPanel } from "@/components/admin/growth/GrowthInboxPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { GrowthXHiringPanel } from "@/components/admin/growth/GrowthXHiringPanel";
import { JobApplicationsPanel } from "@/components/admin/jobs/JobApplicationsPanel";
import { jobLeadSources } from "@/lib/growth/types";
import Link from "next/link";
import { useState } from "react";

export default function GrowthJobsPage() {
  const [inboxKey, setInboxKey] = useState(0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Jobs"
        description="X and LinkedIn social harvest only — each lead keeps a post URL. Huginn, freehire, and job-board ingests are out of the pipeline."
      />
      <GrowthXHiringPanel />
      <GrowthCrmPipelineBanner />
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Your applications</h2>
        <p className="text-xs text-muted">
          Every X reply and ATS apply is logged with post and apply links — track response
          status here.
        </p>
        <JobApplicationsPanel />
      </section>
      <p className="text-xs text-muted">
        LinkedIn company posts: run{" "}
        <Link href="/admin/growth" className="text-accent hover:underline">
          Growth → Harvest
        </Link>{" "}
        with a connected LinkedIn session. Legacy freehire / Huginn data was cleared from the
        pipeline.
      </p>
      <GrowthInboxPanel
        key={inboxKey}
        fixedLeadSources={[...jobLeadSources]}
      />
    </div>
  );
}
