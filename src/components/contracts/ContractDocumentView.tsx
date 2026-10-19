import { InvoiceHeader } from "@/components/payments/InvoiceHeader";
import { BRAND_BURGUNDY } from "@/lib/company";
import { markdownToContractHtml } from "@/lib/contracts/markdown";
import {
  contractDocumentKindLabel,
  type ContractEngagement,
} from "@/lib/contracts/types";
import { formatDateTime } from "@/lib/format-datetime";

export function ContractDocumentView({
  engagement,
  compact = false,
}: {
  engagement: ContractEngagement;
  compact?: boolean;
}) {
  const bodyHtml = markdownToContractHtml(engagement.bodyMarkdown);

  return (
    <article
      className={`relative overflow-visible rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] shadow-sm ${
        compact ? "p-5" : "p-6 md:p-8"
      }`}
    >
      <InvoiceHeader compact={compact} />

      <div className={`flex flex-wrap items-start justify-between gap-2 ${compact ? "mb-4" : "mb-6"}`}>
        <div className="min-w-0">
          <p
            className="text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: BRAND_BURGUNDY }}
          >
            {contractDocumentKindLabel(engagement.documentKind)}
          </p>
          <h1
            className={`mt-1 font-semibold tracking-tight ${compact ? "text-base" : "text-lg"}`}
          >
            {engagement.title}
          </h1>
          <p className="mt-1 font-mono text-xs text-[#64748b]">{engagement.reference}</p>
        </div>
      </div>

      <div
        className={`mb-6 grid gap-4 ${compact ? "text-xs" : "sm:grid-cols-2 text-sm"}`}
      >
        <div className="rounded-lg border border-[#eef2f6] bg-[#fafbfc] p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">
            Client
          </p>
          <p className="mt-2 font-semibold">{engagement.customerName}</p>
          {engagement.companyName && (
            <p className="text-[#475569]">{engagement.companyName}</p>
          )}
          <p className="mt-0.5 break-all text-[#64748b]">{engagement.customerEmail}</p>
        </div>
        <div className="rounded-lg border border-[#eef2f6] bg-[#fafbfc] p-3 sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">
            Document
          </p>
          <p className="mt-2 font-medium">{formatDateTime(engagement.updatedAt)}</p>
          {engagement.sentAt && (
            <p className="mt-1 text-[#64748b]">
              Sent {formatDateTime(engagement.sentAt)}
            </p>
          )}
        </div>
      </div>

      <div
        className={`contract-body prose-contract border-t border-[#eef2f6] pt-6 text-[15px] leading-relaxed text-[#334155] ${
          compact ? "text-sm" : ""
        }`}
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </article>
  );
}
