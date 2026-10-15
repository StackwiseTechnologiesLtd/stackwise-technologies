import { GrowthSettingsPanel } from "@/components/admin/growth/GrowthSettingsPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function GrowthSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Growth settings"
        description="ICP scoring rules and encrypted LinkedIn / X session cookies for your local connector."
      />
      <GrowthSettingsPanel />
    </div>
  );
}
