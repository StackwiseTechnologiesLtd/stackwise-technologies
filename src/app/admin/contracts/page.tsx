import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ContractsList } from "@/components/admin/ContractsList";
import { getAdminSession } from "@/lib/auth/session";
import { listContractEngagements } from "@/lib/db/contracts";
import { ADMIN_BTN_PRIMARY_BLOCK } from "@/lib/ui/admin";

export default async function AdminContractsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const engagements = await listContractEngagements();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Agreements"
        description="AI-drafted contracts and legal documents. Review every draft before it reaches the client."
        actions={
          <Link href="/admin/contracts/new" className={ADMIN_BTN_PRIMARY_BLOCK}>
            New agreement
          </Link>
        }
      />

      <ContractsList engagements={engagements} />

      {engagements.length === 0 && (
        <div className="rounded-xl border border-line bg-panel p-8 text-center">
          <p className="text-muted">No agreements yet.</p>
          <Link
            href="/admin/contracts/new"
            className="mt-4 inline-block text-accent hover:underline"
          >
            Draft your first agreement
          </Link>
        </div>
      )}
    </div>
  );
}
