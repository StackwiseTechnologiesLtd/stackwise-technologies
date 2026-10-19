import Mark from "@/components/Mark";
import { ContractMarkdownBody } from "@/components/contracts/ContractMarkdownBody";
import { BRAND_BURGUNDY, companyFooterLines } from "@/lib/company";
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
  const [companyName, ...companyDetails] = companyFooterLines;

  return (
    <article className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white text-[#0f172a] shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="border-b border-[#eef2f6] bg-gradient-to-b from-[#fafbfc] to-white px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Mark className="h-10 w-10 shrink-0" gradientId="sw-contract-mark" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                {contractDocumentKindLabel(engagement.documentKind)}
              </p>
              <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
                {engagement.title}
              </h1>
              <p className="mt-1 font-mono text-xs text-[#94a3b8]">{engagement.reference}</p>
            </div>
          </div>
          {variant === "client" && engagement.deliveryPhase !== "agreement" && (
            <span
              className="inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1"
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

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-[#94a3b8]">
              Client
            </dt>
            <dd className="mt-1 font-medium">{engagement.customerName}</dd>
            {engagement.companyName && (
              <dd className="text-[#64748b]">{engagement.companyName}</dd>
            )}
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-[#94a3b8]">
              Contact
            </dt>
            <dd className="mt-1 break-all text-[#475569]">{engagement.customerEmail}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-[#94a3b8]">
              Updated
            </dt>
            <dd className="mt-1 text-[#475569]">{formatDateTime(engagement.updatedAt)}</dd>
            {engagement.acceptedAt && (
              <dd className="mt-0.5 text-xs text-emerald-700">
                Accepted {formatDateTime(engagement.acceptedAt)}
                {engagement.acceptedByName ? ` · ${engagement.acceptedByName}` : ""}
              </dd>
            )}
          </div>
        </dl>
      </div>

      <div className="px-6 py-6 sm:px-8 sm:py-8">
        <ContractMarkdownBody markdown={engagement.bodyMarkdown} />
      </div>

      <footer className="border-t border-[#eef2f6] bg-[#fafbfc] px-6 py-4 text-xs leading-relaxed text-[#64748b] sm:px-8">
        <p className="font-semibold text-[#334155]">{companyName}</p>
        {companyDetails.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </footer>
    </article>
  );
}
