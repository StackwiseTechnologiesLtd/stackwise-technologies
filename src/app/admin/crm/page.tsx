import { CrmWorkspace } from "@/components/admin/crm/CrmWorkspace";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { parseCrmSavedView } from "@/lib/crm/saved-views";

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ o?: string; view?: string }>;
}) {
  const q = await searchParams;
  const initialOpportunityId = q.o?.trim() || null;
  const initialSavedView = parseCrmSavedView(q.view);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="CRM"
        description="Primary pipeline for qualified leads (default ≥45% fit). Inbox and harvest stay under Growth for triage and replies."
      />
      <CrmWorkspace
        initialOpportunityId={initialOpportunityId}
        initialSavedView={initialSavedView}
      />
    </div>
  );
}
