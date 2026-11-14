import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { GrowthInstagramPanel } from "@/components/admin/growth/GrowthInstagramPanel";

export default function GrowthInstagramPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Instagram DM"
        description="Comment keywords → private DMs on the Worker. OpenReply-style delivery log; connect Meta apps and paste tokens until OAuth lands."
      />
      <GrowthInstagramPanel />
    </div>
  );
}