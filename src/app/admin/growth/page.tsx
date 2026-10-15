"use client";

import { GrowthCaptureForm } from "@/components/admin/growth/GrowthCaptureForm";
import { GrowthHarvestPanel } from "@/components/admin/growth/GrowthHarvestPanel";
import { GrowthInboxPanel } from "@/components/admin/growth/GrowthInboxPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useState } from "react";

export default function GrowthInboxPage() {
  const [inboxKey, setInboxKey] = useState(0);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Inbox"
        description="Personalized reply drafts for founders and decision makers — review before posting."
      />
      <GrowthInboxPanel key={inboxKey} />
      <div className="grid gap-6 lg:grid-cols-2">
        <GrowthHarvestPanel onHarvested={() => setInboxKey((k) => k + 1)} />
        <GrowthCaptureForm onCreated={() => setInboxKey((k) => k + 1)} />
      </div>
    </div>
  );
}
