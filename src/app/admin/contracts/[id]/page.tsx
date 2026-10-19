import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ContractReviewPanel } from "@/components/admin/ContractReviewPanel";
import { ContractStatusBadge } from "@/components/admin/ContractStatusBadge";
import { ContractDocumentView } from "@/components/contracts/ContractDocumentView";
import { getAdminSession } from "@/lib/auth/session";
import { contractClientUrl } from "@/lib/contracts/urls";
import { getContractEngagementById } from "@/lib/db/contracts";

export default async function AdminContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const engagement = await getContractEngagementById(id);
  if (!engagement) notFound();

  const clientUrl = contractClientUrl(engagement);
  const readOnly =
    engagement.status === "SENT" || engagement.status === "GENERATING";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/contracts" className="text-sm text-muted hover:text-foreground">
            ← Agreements
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{engagement.reference}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ContractStatusBadge status={engagement.status} />
            <p className="text-sm text-muted">{engagement.customerName}</p>
          </div>
        </div>
      </div>

      {engagement.status === "GENERATING" && (
        <p className="text-sm text-muted">Generating draft… refresh in a moment.</p>
      )}

      {(engagement.status === "SENT" || engagement.status === "FEEDBACK_RECEIVED") && (
        <div className="rounded-xl border border-line bg-background p-4">
          <p className="text-sm text-muted">Client link</p>
          <a
            href={clientUrl}
            className="mt-1 block break-all font-mono text-sm text-accent hover:underline"
          >
            {clientUrl}
          </a>
        </div>
      )}

      {readOnly && engagement.status !== "GENERATING" ? (
        <ContractDocumentView engagement={engagement} />
      ) : (
        <ContractReviewPanel engagement={engagement} />
      )}
    </div>
  );
}
