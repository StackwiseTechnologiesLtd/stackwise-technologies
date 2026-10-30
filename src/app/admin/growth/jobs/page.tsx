"use client";

import { GrowthCrmPipelineBanner } from "@/components/admin/growth/GrowthCrmPipelineBanner";
import { GrowthInboxPanel } from "@/components/admin/growth/GrowthInboxPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function GrowthJobsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Jobs"
        description="Hiring-intent leads from freehire. Filter by freshness; duplicates are skipped by job URL."
      />
      <GrowthCrmPipelineBanner />
      <GrowthInboxPanel fixedLeadSource="freehire" />
    </div>
  );
}
