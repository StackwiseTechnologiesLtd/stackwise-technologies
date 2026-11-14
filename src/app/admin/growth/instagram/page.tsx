import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { GrowthInstagramOAuthBanner } from "@/components/admin/growth/GrowthInstagramOAuthBanner";
import { GrowthInstagramPanel } from "@/components/admin/growth/GrowthInstagramPanel";

export default function GrowthInstagramPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Instagram DM"
        description="Comment and DM keyword campaigns on the Worker. Add a Meta app, copy the OAuth redirect URI below into the developer console, then Connect with Meta OAuth."
      />
      <Suspense fallback={null}>
        <GrowthInstagramOAuthBanner />
      </Suspense>
      <GrowthInstagramPanel />
    </div>
  );
}