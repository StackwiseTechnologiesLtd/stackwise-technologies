import { CrmWorkspace } from "@/components/admin/crm/CrmWorkspace";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ o?: string }>;
}) {
  const q = await searchParams;
  const initialOpportunityId = q.o?.trim() || null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="CRM"
        description="Primary pipeline for qualified leads (default ≥45% fit). Inbox and harvest stay under Growth for triage and replies."
      />
      <CrmWorkspace initialOpportunityId={initialOpportunityId} />
    </div>
  );
}
