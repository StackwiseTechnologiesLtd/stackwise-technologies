import { CrmPipelineBoard } from "@/components/admin/crm/CrmPipelineBoard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function CrmPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="CRM"
        description="Primary pipeline for all Growth leads (harvest, Huginn, manual). Inbox is for triage and replies; stages live here and in Growth Leads."
      />
      <CrmPipelineBoard />
    </div>
  );
}
