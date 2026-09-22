import { StatusBadge } from "@/components/admin/StatusBadge";
import { InvoiceHeader } from "@/components/payments/InvoiceHeader";
import { InvoiceStamp } from "@/components/payments/InvoiceStamp";
import { BRAND_BURGUNDY } from "@/lib/company";
import { EMAIL } from "@/lib/content";
import { formatMoney } from "@/lib/currency";
import type { PaymentLink } from "@/lib/payments/types";

export function InvoiceView({
  link,
  showStatus = true,
  variant = "invoice",
  compact = false,
}: {
  link: PaymentLink;
  showStatus?: boolean;
  variant?: "invoice" | "receipt";
  compact?: boolean;
}) {
  const isReceipt = variant === "receipt" || link.status === "PAID";
  const title = isReceipt ? "Receipt" : "Invoice";

  return (
    <article
      className={`relative overflow-visible rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] shadow-sm print:border print:shadow-none ${compact ? "p-5" : "p-6 md:p-8"
        }`}
    >
      <InvoiceHeader compact={compact} />

      <div
        className={`flex flex-wrap items-start justify-between gap-2 ${compact ? "mb-2" : "mb-4"}`}
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
            Paid {new Date(link.paidAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div
        className={`mb-6 grid gap-4 ${compact ? "text-xs" : "sm:grid-cols-2 text-sm"}`}
      >
        <div className="rounded-lg border border-[#eef2f6] bg-[#fafbfc] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">
            Bill to
          </p>
          <p className="mt-2 font-semibold text-[#0f172a]">{link.customerName}</p>
          <p className="mt-0.5 break-all text-[#64748b]">{link.customerEmail}</p>
        </div>
        <div className="rounded-lg border border-[#eef2f6] bg-[#fafbfc] p-4 sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">
            {isReceipt ? "Receipt details" : "Invoice details"}
          </p>
          <p className="mt-2">
            <span className="text-[#64748b]">Date </span>
            <span className="font-medium">
              {new Date(link.createdAt).toLocaleDateString()}
            </span>
          </p>
          {link.kpayReference && (
            <p className="mt-2">
              <span className="text-[#64748b]">Reference </span>
              <span className="font-mono text-[11px] font-medium sm:text-xs">
                {link.kpayReference}
              </span>
            </p>
          )}
        </div>
      </div>

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
              <span className="tabular-nums">${link.amountUsd.toFixed(2)} USD</span>
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
        Questions? Contact {EMAIL}
      </p>
    </article>
  );
}
