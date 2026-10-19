import { ContractEngagementOpsPanel } from "@/components/admin/ContractEngagementOpsPanel";
import { ContractReviewPanel } from "@/components/admin/ContractReviewPanel";
import { ContractStatusBadge } from "@/components/admin/ContractStatusBadge";
import { ContractDocumentView } from "@/components/contracts/ContractDocumentView";
import { getAdminSession } from "@/lib/auth/session";
import { contractClientUrl } from "@/lib/contracts/urls";
import { getContractEngagementById } from "@/lib/db/contracts";
import { listPaymentLinksForEngagement } from "@/lib/db/payment-links";
import { notFound, redirect } from "next/navigation";

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
  const paymentLinks = await listPaymentLinksForEngagement(engagement.id);

  const inReview =
    engagement.status === "PENDING_REVIEW" ||
    engagement.status === "FEEDBACK_RECEIVED" ||
    engagement.status === "GENERATION_FAILED";

  const readOnlySent = engagement.status === "SENT";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
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

      {engagement.status !== "GENERATING" && engagement.status !== "PENDING_REVIEW" && (
        <div className="rounded-xl border border-line bg-background p-4">
          <p className="text-sm text-muted">Client portal</p>
          <a
            href={clientUrl}
            className="mt-1 block break-all font-mono text-sm text-accent hover:underline"
          >
            {clientUrl}
          </a>
        </div>
      )}

      <ContractEngagementOpsPanel engagement={engagement} paymentLinks={paymentLinks} />

      {inReview && <ContractReviewPanel engagement={engagement} />}

      {readOnlySent && <ContractDocumentView engagement={engagement} variant="admin" />}

      {(engagement.status === "ACCEPTED" ||
        engagement.status === "IN_PROGRESS" ||
        engagement.status === "COMPLETED") && (
          <ContractDocumentView engagement={engagement} variant="admin" />
        )}
    </div>
  );
}
