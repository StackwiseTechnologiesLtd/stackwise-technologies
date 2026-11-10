"use client";

import { GrowthCrmPipelineBanner } from "@/components/admin/growth/GrowthCrmPipelineBanner";
import { GrowthInboxPanel } from "@/components/admin/growth/GrowthInboxPanel";
import { GrowthLinkedInJobsHarvestPanel } from "@/components/admin/growth/GrowthLinkedInJobsHarvestPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { jobLeadSources } from "@/lib/growth/types";
import { useState } from "react";

export default function GrowthJobsPage() {
  const [inboxKey, setInboxKey] = useState(0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Jobs"
        description="Hiring-intent leads from freehire and LinkedIn Jobs. Filter by freshness; duplicates are skipped by job URL."
      />
      <GrowthCrmPipelineBanner />
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
