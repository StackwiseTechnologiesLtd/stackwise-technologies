import { formatMoney } from "@/lib/currency";
import { EMAIL } from "@/lib/content";
import type { PaymentLink } from "@/lib/payments/types";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { InvoiceHeader } from "@/components/payments/InvoiceHeader";
import { InvoiceStamp } from "@/components/payments/InvoiceStamp";

export function InvoiceView({
  link,
  showStatus = true,
  variant = "invoice",
}: {
  link: PaymentLink;
  showStatus?: boolean;
  variant?: "invoice" | "receipt";
}) {
  const isReceipt = variant === "receipt" || link.status === "PAID";
  const title = isReceipt ? "Receipt" : "Invoice";

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#e2e8f0] bg-white p-6 text-[#0f172a] shadow-sm md:p-8 print:border print:shadow-none">
      <InvoiceHeader />

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0f172a]">{title}</h1>
          <p className="mt-1 font-mono text-sm text-[#64748b]">{link.invoiceNumber}</p>
        </div>
        {showStatus && link.status !== "PAID" && (
          <StatusBadge status={link.status} />
        )}
        {link.status === "PAID" && link.paidAt && (
          <p className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Paid {new Date(link.paidAt).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="mb-8 grid gap-4 text-sm md:grid-cols-2">
        <div>
          <p className="text-[#64748b]">Bill to</p>
          <p className="font-medium">{link.customerName}</p>
          <p className="text-[#64748b]">{link.customerEmail}</p>
        </div>
        <div className="md:text-right">
          <p className="text-[#64748b]">Date</p>
          <p>{new Date(link.createdAt).toLocaleDateString()}</p>
          {link.kpayReference && (
            <>
              <p className="mt-3 text-[#64748b]">Reference</p>
              <p className="font-mono text-xs">{link.kpayReference}</p>
            </>
          )}
        </div>
      </div>

      <table className="mb-8 w-full text-sm">
        <thead>
          <tr className="border-b border-[#e2e8f0] text-left text-[#64748b]">
            <th className="pb-3 font-medium">Service</th>
            <th className="pb-3 text-right font-medium">Qty</th>
            <th className="pb-3 text-right font-medium">Unit (USD)</th>
            <th className="pb-3 text-right font-medium">Total (USD)</th>
          </tr>
        </thead>
        <tbody>
          {link.lineItems.map((item, i) => (
            <tr key={i} className="border-b border-[#f1f5f9]">
              <td className="py-3">
                <p className="font-medium">{item.name}</p>
                {item.description && (
                  <p className="text-xs text-[#64748b]">{item.description}</p>
                )}
              </td>
              <td className="py-3 text-right">{item.quantity}</td>
              <td className="py-3 text-right">${item.unitPriceUsd.toFixed(2)}</td>
              <td className="py-3 text-right">
                ${(item.quantity * item.unitPriceUsd).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-2 border-t border-[#e2e8f0] pt-6 text-sm">
        <div className="flex justify-between">
          <span className="text-[#64748b]">Subtotal (USD)</span>
          <span className="font-medium">${link.amountUsd.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#64748b]">Local amount ({link.currency})</span>
          <span>{formatMoney(link.amountLocal, link.currency)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <span>{isReceipt ? "Amount paid" : "Amount due"}</span>
          <span>${link.amountUsd.toFixed(2)} USD</span>
        </div>
      </div>

      {link.notes && (
        <div className="mt-6 rounded-lg bg-[#f8fafc] p-4 text-sm text-[#64748b]">
          {link.notes}
        </div>
      )}

      <p className="mt-8 text-xs text-[#64748b]">
        Questions? Contact {EMAIL}
      </p>

      {isReceipt && <InvoiceStamp />}
    </div>
  );
}
