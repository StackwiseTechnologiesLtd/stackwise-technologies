import { StatusBadge } from "@/components/admin/StatusBadge";
import { InvoiceHeader } from "@/components/payments/InvoiceHeader";
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
  const title = isReceipt ? "Receipt" : "Invoice";
  const reference = displayPaymentReference(link);
  const collectionTime = link.collectedAt ?? link.paidAt;
  const showPaymentDetails =
    isReceipt &&
    (link.paymentSource === "MANUAL" ||
      link.paymentMethod ||
      link.paymentNotes ||
      link.amountReceivedUsd != null);

  return (
    <article
      className={`relative overflow-visible rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] shadow-sm print:border print:shadow-none ${
        printMode ? "receipt-print-document" : ""
      } ${compact ? "p-5" : "p-6 md:p-8 print:p-0"}`}
    >
      <InvoiceHeader compact={compact} />

      <div
        className={`flex flex-wrap items-start justify-between gap-2 ${compact ? "mb-2" : "mb-3"}`}
      >
        <div className="min-w-0">
          <p
            className="text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: BRAND_BURGUNDY }}
          >
            {title}
          </p>
          <h1
            className={`mt-1 font-semibold tracking-tight ${compact ? "text-md" : "text-lg"}`}
          >
            {link.invoiceNumber}
          </h1>
        </div>
        {showStatus && link.status !== "PAID" && (
          <StatusBadge status={link.status} />
        )}
        {link.status === "PAID" && link.paidAt && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
            Paid {formatDate(link.paidAt)}
          </span>
        )}
      </div>

      <div
        className={`mb-2 grid gap-4 ${compact ? "text-xs" : "sm:grid-cols-2 text-sm"}`}
      >
        <div className="rounded-lg border border-[#eef2f6] bg-[#fafbfc] p-2">
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">
            Bill to
          </p>
          <p className="mt-2 font-semibold text-[#0f172a]">{link.customerName}</p>
          <p className="mt-0.5 break-all text-[#64748b]">{link.customerEmail}</p>
        </div>
        <div className="rounded-lg border border-[#eef2f6] bg-[#fafbfc] p-2 sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">
            {isReceipt ? "Receipt details" : "Invoice details"}
          </p>
          <p className="mt-2">
            <span className="text-[#64748b]">Date </span>
            <span className="font-medium">
              {formatDateTime(link.createdAt)}
            </span>
          </p>
          {reference && !showPaymentDetails && (
            <p className="mt-2">
              <span className="text-[#64748b]">Reference </span>
              <span className="font-mono text-[11px] font-medium sm:text-xs">
                {reference}
              </span>
            </p>
          )}
        </div>
      </div>

      {showPaymentDetails && (
        <div
          className={`mb-4 rounded-lg border border-[#eef2f6] bg-[#fafbfc] ${compact ? "p-3 text-xs" : "p-4 text-sm"}`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">
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

      <div className={compact ? "" : "overflow-x-auto"}>
        <table className={`mb-6 w-full ${compact ? "text-xs" : "min-w-120 text-sm"}`}>
          <thead>
            <tr
              className="border-b-2 text-left text-[#475569]"
              style={{ borderColor: `${BRAND_BURGUNDY}33` }}
            >
              <th className="pb-3 pr-4 font-semibold">Service</th>
              {!compact && <th className="pb-3 text-right font-semibold">Qty</th>}
              {!compact && (
                <th className="pb-3 text-right font-semibold">Unit (USD)</th>
              )}
              <th className="pb-3 text-right font-semibold">Total (USD)</th>
            </tr>
          </thead>
          <tbody>
            {link.lineItems.map((item, i) => (
              <tr key={i} className="border-b border-[#f1f5f9]">
                <td className="py-3 pr-4">
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
                  <td className="py-3 text-right tabular-nums">{item.quantity}</td>
                )}
                {!compact && (
                  <td className="py-3 text-right tabular-nums">
                    ${item.unitPriceUsd.toFixed(2)}
                  </td>
                )}
                <td className="py-3 text-right tabular-nums font-medium">
                  ${(item.quantity * item.unitPriceUsd).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className={`relative ${isReceipt ? (compact ? "pb-16" : "pb-20 sm:pb-24") : ""}`}
      >
        <div
          className={`ml-auto w-full max-w-sm rounded-xl border border-[#e8ecf1] bg-[#fafbfc] ${compact ? "p-4" : "p-5"
            } ${isReceipt ? "pr-2 sm:pr-3" : ""}`}
        >
          <div className={`space-y-2 w-full flex flex-col gap-2 ${compact ? "text-xs" : "text-sm"}`}>
            <div className="flex justify-between gap-4 w-full">
              <span className="text-[#64748b]">Subtotal (USD)</span>
              <span className="font-medium tabular-nums">
                ${link.amountUsd.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#64748b]">Local amount ({link.currency})</span>
              <span className="tabular-nums">
                {formatMoney(link.amountLocal, link.currency)}
              </span>
            </div>
            <div className="flex justify-between gap-4 text-[#64748b]">
              <span>Exchange rate</span>
              <span className="tabular-nums">
                1 USD = {link.exchangeRate.toFixed(4)} {link.currency}
              </span>
            </div>
            <div
              className={`flex justify-between gap-4 border-t border-[#e2e8f0] pt-3 font-semibold ${compact ? "text-sm" : "text-base"
                }`}
            >
              <span>{isReceipt ? "Amount paid" : "Amount due"}</span>
              <span className="tabular-nums">
                ${(isReceipt ? paidAmountUsd(link) : link.amountUsd).toFixed(2)} USD
              </span>
            </div>
          </div>

          {isReceipt && <InvoiceStamp compact={compact} />}
        </div>
      </div>

      {link.notes && (
        <div
          className={`mt-6 rounded-lg border border-[#eef2f6] bg-[#fafbfc] text-[#64748b] ${compact ? "p-3 text-xs" : "p-4 text-sm"
            }`}
        >
          {link.notes}
        </div>
      )}

      <p className={`mt-6 text-[#64748b] ${compact ? "text-[11px]" : "text-xs"}`}>
        Questions? Reach out to {EMAIL}
      </p>
    </article>
  );
}
