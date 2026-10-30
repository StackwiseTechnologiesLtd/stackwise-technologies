"use client";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { GrowthOutreachPanel } from "@/components/admin/growth/GrowthOutreachPanel";

export default function GrowthOutreachPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Email outreach"
        description="Tailored cold emails from the Stackwise template. Sends only when a lead or CRM person has an email on file."
      />
      <GrowthOutreachPanel />
    </div>
  );
}
