import { StatusBadge } from "@/components/admin/StatusBadge";
import { BrandDocumentShell } from "@/components/documents/BrandDocumentShell";
import { InvoiceStamp } from "@/components/payments/InvoiceStamp";
import { BRAND_BURGUNDY } from "@/lib/company";
import { EMAIL } from "@/lib/content";
import { formatMoney } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/format-datetime";
import { formatPaymentMethodLabel } from "@/lib/payments/manual-payment-methods";
import {
  displayPaymentReference,
  paidAmountLocal,
  paidAmountUsd,
} from "@/lib/payments/payment-display";
import type { PaymentLink } from "@/lib/payments/types";

export function InvoiceView({
  link,
  showStatus = true,
  variant = "invoice",
  compact = false,
  printMode = false,
}: {
  link: PaymentLink;
  showStatus?: boolean;
  variant?: "invoice" | "receipt";
  compact?: boolean;
  printMode?: boolean;
}) {
  const isReceipt = variant === "receipt" || link.status === "PAID";
  const documentLabel = isReceipt ? "RECEIPT" : "INVOICE";
  const reference = displayPaymentReference(link);
  const collectionTime = link.collectedAt ?? link.paidAt;
  const showPaymentDetails =
    isReceipt &&
    (link.paymentSource === "MANUAL" ||
      link.paymentMethod ||
      link.paymentNotes ||
      link.amountReceivedUsd != null);

  return (
    <BrandDocumentShell
      documentLabel={documentLabel}
      compact={compact}
      markId="sw-invoice-mark"
      className={printMode ? "receipt-print-document !shadow-none !border-0" : ""}
      footerExtra={
        <p className="mt-2 text-[#94a3b8]">
          Questions? {EMAIL}
        </p>
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="brand-doc-meta-label">{isReceipt ? "Receipt no." : "Invoice no."}</p>
          <p className="brand-doc-meta-value brand-doc-meta-value--accent">
            {link.invoiceNumber}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showStatus && link.status !== "PAID" && <StatusBadge status={link.status} />}
          {link.status === "PAID" && link.paidAt && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              Paid {formatDate(link.paidAt)}
            </span>
          )}
        </div>
      </div>

      <div
        className={`mt-8 grid gap-8 ${compact ? "text-xs" : "sm:grid-cols-2 text-sm"}`}
      >
        <div>
          <p className="brand-doc-to-label">Bill to</p>
          <p className="brand-doc-to-name">{link.customerName}</p>
          <p className="mt-2 break-all text-[#64748b]">{link.customerEmail}</p>
        </div>
        <div className={compact ? "" : "sm:text-right"}>
          <p className="brand-doc-meta-label">Date</p>
          <p className="brand-doc-meta-value">{formatDateTime(link.createdAt)}</p>
          {reference && !showPaymentDetails && (
            <>
              <p className="brand-doc-meta-label mt-4">Reference</p>
              <p className="brand-doc-meta-value font-mono text-xs">{reference}</p>
            </>
          )}
        </div>
      </div>

      {showPaymentDetails && (
        <div
          className={`mt-6 rounded-lg border border-[#eef2f6] bg-[#fafbfc]/80 ${compact ? "p-3 text-xs" : "p-4 text-sm"}`}
        >
          <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: BRAND_BURGUNDY }}>
            Payment details
          </p>
          <dl className={`mt-3 grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
            {link.paymentMethod && (
              <div>
                <dt className="text-[#64748b]">Method</dt>
                <dd className="font-medium text-[#0f172a]">
                  {formatPaymentMethodLabel(link.paymentMethod)}
                </dd>
              </div>
            )}
            {collectionTime && (
              <div>
                <dt className="text-[#64748b]">Collected</dt>
                <dd className="font-medium tabular-nums text-[#0f172a]">
                  {formatDateTime(collectionTime)}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-[#64748b]">Amount received</dt>
              <dd className="font-medium tabular-nums text-[#0f172a]">
                ${paidAmountUsd(link).toFixed(2)} USD ·{" "}
                {formatMoney(paidAmountLocal(link), link.currency)}
              </dd>
            </div>
            {reference && (
              <div>
                <dt className="text-[#64748b]">Reference</dt>
                <dd className="font-mono text-[11px] font-medium text-[#0f172a] sm:text-xs">
                  {reference}
                </dd>
              </div>
            )}
          </dl>
          {link.paymentNotes && (
            <p className={`mt-3 text-[#64748b] ${compact ? "text-xs" : "text-sm"}`}>
              <span className="font-medium text-[#475569]">Notes: </span>
              {link.paymentNotes}
            </p>
          )}
        </div>
      )}

      <div className={`mt-8 ${compact ? "" : "overflow-x-auto"}`}>
        <table className={`brand-doc-table ${compact ? "text-xs" : ""}`}>
          <thead>
            <tr>
              <th>Service</th>
              {!compact && <th className="!text-right">Qty</th>}
              {!compact && <th className="!text-right">Unit (USD)</th>}
              <th>Total (USD)</th>
            </tr>
          </thead>
          <tbody>
            {link.lineItems.map((item, i) => (
              <tr key={i}>
                <td>
                  <p className="font-medium text-[#0f172a]">{item.name}</p>
                  {item.description && (
                    <p className={`mt-0.5 text-[#64748b] ${compact ? "line-clamp-2" : ""}`}>
                      {item.description}
                    </p>
                  )}
                  {compact && (
                    <p className="mt-1 text-[#64748b]">
                      {item.quantity} × ${item.unitPriceUsd.toFixed(2)}
                    </p>
                  )}
                </td>
                {!compact && (
                  <td className="tabular-nums text-right">{item.quantity}</td>
                )}
                {!compact && (
                  <td className="tabular-nums text-right">
                    ${item.unitPriceUsd.toFixed(2)}
                  </td>
                )}
                <td className="tabular-nums font-medium">
                  ${(item.quantity * item.unitPriceUsd).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className={`relative mt-6 ${isReceipt ? (compact ? "pb-16" : "pb-20 sm:pb-24") : ""}`}
      >
        <div className={`brand-doc-totals ${isReceipt ? "pr-2 sm:pr-3" : ""}`}>
          <div className={`space-y-2 ${compact ? "text-xs" : "text-sm"}`}>
            <div className="flex justify-between gap-4">
              <span className="text-[#64748b]">Subtotal (USD)</span>
              <span className="font-medium tabular-nums">${link.amountUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#64748b]">Local ({link.currency})</span>
              <span className="tabular-nums">
                {formatMoney(link.amountLocal, link.currency)}
              </span>
            </div>
            <div className="flex justify-between gap-4 text-[#64748b]">
              <span>Rate</span>
              <span className="tabular-nums">
                1 USD = {link.exchangeRate.toFixed(4)} {link.currency}
              </span>
            </div>
            <div
              className={`flex justify-between gap-4 border-t border-[#e2e8f0] pt-3 font-bold ${compact ? "text-sm" : "text-base"}`}
              style={{ color: BRAND_BURGUNDY }}
            >
              <span>{isReceipt ? "Amount paid" : "Amount due"}</span>
              <span className="tabular-nums text-[#0f172a]">
                ${(isReceipt ? paidAmountUsd(link) : link.amountUsd).toFixed(2)} USD
              </span>
            </div>
          </div>
          {isReceipt && <InvoiceStamp compact={compact} />}
        </div>
      </div>

      {link.notes && (
        <div
          className={`mt-6 rounded-lg border border-[#eef2f6] bg-[#fafbfc] text-[#64748b] ${compact ? "p-3 text-xs" : "p-4 text-sm"}`}
        >
          {link.notes}
        </div>
      )}
    </BrandDocumentShell>
  );
}
