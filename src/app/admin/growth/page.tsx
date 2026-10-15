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
        title="Growth inbox"
        description="Review scored leads and reply drafts before anything goes to LinkedIn or X."
      />
      <GrowthHarvestPanel onHarvested={() => setInboxKey((k) => k + 1)} />
      <GrowthCaptureForm onCreated={() => setInboxKey((k) => k + 1)} />
      <GrowthInboxPanel key={inboxKey} />
    </div>
  );
}
