import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

/** Deep links open the CRM workspace with the opportunity modal. */
export default async function CrmOpportunityRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/crm?o=${encodeURIComponent(id)}`);
}
