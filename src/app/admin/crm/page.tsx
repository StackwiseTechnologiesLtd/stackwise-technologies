import { CrmWorkspace } from "@/components/admin/crm/CrmWorkspace";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function CrmPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="CRM"
        description="Primary pipeline for qualified leads (default ≥45% fit). Inbox and harvest stay under Growth for triage and replies."
      />
      <CrmWorkspace />
    </div>
  );
}
