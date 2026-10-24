"use client";

import { GrowthCrmPipelineBanner } from "@/components/admin/growth/GrowthCrmPipelineBanner";
import { GrowthHarvestPanel } from "@/components/admin/growth/GrowthHarvestPanel";
import { GrowthInboxPanel } from "@/components/admin/growth/GrowthInboxPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useState } from "react";

export default function GrowthLinkedInInboxPage() {
  const [inboxKey, setInboxKey] = useState(0);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="LinkedIn inbox"
        description="Harvest LinkedIn posts, draft comment replies, and track what you have posted."
      />
      <GrowthCrmPipelineBanner />
      <GrowthInboxPanel key={inboxKey} fixedPlatform="linkedin" />
      <GrowthHarvestPanel
        focusPlatform="linkedin"
        onHarvested={() => setInboxKey((k) => k + 1)}
      />
    </div>
  );
}
