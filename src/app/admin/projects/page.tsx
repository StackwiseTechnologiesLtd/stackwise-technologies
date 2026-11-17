import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AgencyProjectsList } from "@/components/admin/agency/AgencyProjectsList";
import { getAdminSession } from "@/lib/auth/session";

export default async function AdminProjectsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Projects"
        description="Client delivery after a deal is won. Milestones due in the next 14 days surface on the agency overview."
      />
      <AgencyProjectsList />
    </div>
  );
}