import { GrowthLeadsTable } from "@/components/admin/growth/GrowthLeadsTable";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function GrowthLeadsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Leads"
        description="Scored prospects from social signals. Update pipeline status as you work them."
      />
      <GrowthLeadsTable />
    </div>
  );
}
