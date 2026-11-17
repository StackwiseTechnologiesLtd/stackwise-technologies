import { redirect } from "next/navigation";
import { AgencyProjectDetailPanel } from "@/components/admin/agency/AgencyProjectDetail";
import { getAdminSession } from "@/lib/auth/session";

type Props = { params: Promise<{ id: string }> };

export default async function AdminProjectDetailPage({ params }: Props) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;

  return (
    <div className="space-y-6 pb-10">
      <AgencyProjectDetailPanel projectId={id} />
    </div>
  );
}