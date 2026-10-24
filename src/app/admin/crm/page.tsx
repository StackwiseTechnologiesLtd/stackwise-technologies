import { CrmPipelineBoard } from "@/components/admin/crm/CrmPipelineBoard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function CrmPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="CRM"
        description="Pipeline for promoted Growth leads. Stages stay in sync with Growth pipeline status."
      />
      <CrmPipelineBoard />
    </div>
  );
}
