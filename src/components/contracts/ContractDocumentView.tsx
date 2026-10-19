import { BrandDocumentShell } from "@/components/documents/BrandDocumentShell";
import { ContractMarkdownBody } from "@/components/contracts/ContractMarkdownBody";
import { BRAND_BURGUNDY } from "@/lib/company";
import { EMAIL } from "@/lib/content";
import {
  contractDocumentKindLabel,
  contractDeliveryPhaseLabel,
  type ContractEngagement,
} from "@/lib/contracts/types";
import { formatDateTime } from "@/lib/format-datetime";

export function ContractDocumentView({
  engagement,
  variant = "client",
}: {
  engagement: ContractEngagement;
  variant?: "client" | "admin";
}) {
  const docLabel = contractDocumentKindLabel(engagement.documentKind).toUpperCase();

  return (
    <BrandDocumentShell
      documentLabel={docLabel}
      markId="sw-contract-mark"
      className="shadow-[0_1px_3px_rgba(15,23,42,0.06),0_16px_48px_rgba(15,23,42,0.05)]"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-[#0f172a] sm:text-2xl">
            {engagement.title}
          </h1>
          <p className="mt-1 font-mono text-xs text-[#94a3b8]">{engagement.reference}</p>
        </div>
        {variant === "client" && engagement.deliveryPhase !== "agreement" && (
          <span
            className="inline-flex shrink-0 self-start rounded-full px-3 py-1 text-xs font-semibold ring-1"
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

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <p className="brand-doc-to-label">To</p>
          <p className="brand-doc-to-name">{engagement.customerName}</p>
          {engagement.companyName && (
            <p className="mt-1 text-sm text-[#64748b]">{engagement.companyName}</p>
          )}
          <p className="mt-2 break-all text-sm text-[#475569]">{engagement.customerEmail}</p>
        </div>
        <div className="sm:text-right">
          <p className="brand-doc-meta-label">Last updated</p>
          <p className="brand-doc-meta-value">{formatDateTime(engagement.updatedAt)}</p>
          {engagement.acceptedAt && (
            <p className="mt-3 text-xs font-medium text-emerald-700">
              Accepted {formatDateTime(engagement.acceptedAt)}
              {engagement.acceptedByName ? ` · ${engagement.acceptedByName}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="mt-10 border-t border-[#eef2f6] pt-8">
        <ContractMarkdownBody markdown={engagement.bodyMarkdown} />
      </div>

      <div className="mt-12 border-t border-dashed border-[#e2e8f0] pt-8">
        <p className="text-xs text-[#94a3b8]">Authorized signatory</p>
        <p
          className="mt-3 font-[family-name:var(--font-brand-signature)] text-2xl text-[#1e293b]"
          style={{ fontFamily: '"Segoe Script", "Bradley Hand", cursive' }}
        >
          Stackwise Technologies
        </p>
        <p className="mt-2 text-sm font-semibold" style={{ color: BRAND_BURGUNDY }}>
          {EMAIL}
        </p>
      </div>
    </BrandDocumentShell>
  );
}
