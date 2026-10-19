import { ContractMarkdownBody } from "@/components/contracts/ContractMarkdownBody";
import { BrandDocumentShell } from "@/components/documents/BrandDocumentShell";
import { InvoiceStamp } from "@/components/payments/InvoiceStamp";
import { BRAND_BURGUNDY } from "@/lib/company";
import {
  contractDeliveryPhaseLabel,
  contractDocumentKindHeaderLabel,
  type ContractEngagement,
} from "@/lib/contracts/types";
import { formatDateTime } from "@/lib/format-datetime";

export function ContractDocumentView({
  engagement,
  variant = "client",
  printSurface = false,
}: {
  engagement: ContractEngagement;
  variant?: "client" | "admin";
  printSurface?: boolean;
}) {
  const docLabel = contractDocumentKindHeaderLabel(engagement.documentKind);

  return (
    <BrandDocumentShell
      documentLabel={docLabel}
      markId="sw-contract-mark"
      printSurface={printSurface}
      className={
        printSurface
          ? ""
          : "shadow-[0_1px_3px_rgba(15,23,42,0.06),0_16px_48px_rgba(15,23,42,0.05)]"
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="brand-doc-doc-title">{engagement.title}</h1>
          <p className="brand-doc-doc-ref">{engagement.reference}</p>
        </div>
        {variant === "client" && engagement.deliveryPhase !== "agreement" && (
          <span
            className="inline-flex shrink-0 self-start rounded-full px-2.5 py-0.5 text-[0.75em] font-semibold ring-1"
            style={{
              color: BRAND_BURGUNDY,
              backgroundColor: "#fdf2f2",
              borderColor: "#fecaca",
            }}
          >
            {contractDeliveryPhaseLabel(engagement.deliveryPhase)}
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 sm:gap-6">
        <div>
          <p className="brand-doc-to-label">To</p>
          <p className="brand-doc-to-name">{engagement.customerName}</p>
          {engagement.companyName && (
            <p className="mt-0.5 text-[0.917em] text-[#64748b]">{engagement.companyName}</p>
          )}
          <p className="mt-1 break-all text-[0.917em] text-[#475569]">
            {engagement.customerEmail}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="brand-doc-meta-label">Last updated</p>
          <p className="brand-doc-meta-value">{formatDateTime(engagement.updatedAt)}</p>
          {engagement.acceptedAt && (
            <p className="mt-2 text-[0.833em] font-medium text-emerald-700">
              Accepted {formatDateTime(engagement.acceptedAt)}
              {engagement.acceptedByName ? ` · ${engagement.acceptedByName}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="relative mt-6 border-t border-[#eef2f6] pt-6 pb-20 sm:pb-24">
        <ContractMarkdownBody markdown={engagement.bodyMarkdown} />
        <InvoiceStamp size="document" />
      </div>
    </BrandDocumentShell>
  );
}
