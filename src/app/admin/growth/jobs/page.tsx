"use client";

import { GrowthCrmPipelineBanner } from "@/components/admin/growth/GrowthCrmPipelineBanner";
import { GrowthInboxPanel } from "@/components/admin/growth/GrowthInboxPanel";
import { GrowthLinkedInJobsHarvestPanel } from "@/components/admin/growth/GrowthLinkedInJobsHarvestPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { GrowthXHiringPanel } from "@/components/admin/growth/GrowthXHiringPanel";
import { JobApplicationsPanel } from "@/components/admin/jobs/JobApplicationsPanel";
import { jobLeadSources } from "@/lib/growth/types";
import { useState } from "react";

export default function GrowthJobsPage() {
  const [inboxKey, setInboxKey] = useState(0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Jobs"
        description="Personal job search: X pipeline and LinkedIn/freehire harvest. Applications are logged with post links."
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
      <GrowthLinkedInJobsHarvestPanel
        onHarvested={() => setInboxKey((k) => k + 1)}
      />
      <GrowthInboxPanel
        key={inboxKey}
        fixedLeadSources={[...jobLeadSources]}
      />
    </div>
  );
}
