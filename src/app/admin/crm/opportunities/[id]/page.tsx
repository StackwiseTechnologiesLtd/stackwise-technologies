import { CrmOpportunityDetailPanel } from "@/components/admin/crm/CrmOpportunityDetail";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

type Props = { params: Promise<{ id: string }> };

export default async function CrmOpportunityPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Opportunity" description="Record detail and activity." />
      <CrmOpportunityDetailPanel opportunityId={id} />
    </div>
  );
}
