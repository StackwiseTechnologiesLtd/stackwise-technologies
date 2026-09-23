import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/format-datetime";
import { formatPaymentMethodLabel } from "@/lib/payments/manual-payment-methods";
import { displayPaymentReference } from "@/lib/payments/manual-payment";
import type { PaymentLink } from "@/lib/payments/types";

export function ManualPaymentSummary({ link }: { link: PaymentLink }) {
  if (link.status !== "PAID" || link.paymentSource !== "MANUAL") {
    return null;
  }

  const reference = displayPaymentReference(link);
  const collectedAt = link.collectedAt ?? link.paidAt;

  return (
    <section className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-6">
      <h2 className="text-lg font-semibold text-emerald-200">Manual payment recorded</h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Payment method</dt>
          <dd className="mt-0.5 font-medium">
            {formatPaymentMethodLabel(link.paymentMethod)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Time of collection</dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {collectedAt ? formatDateTime(collectedAt) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Amount received</dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            ${(link.amountReceivedUsd ?? link.amountUsd).toFixed(2)} USD
            {" · "}
            {formatMoney(
              link.amountReceivedLocal ?? link.amountLocal,
              link.currency,
            )}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Payment reference</dt>
          <dd className="mt-0.5 font-mono text-xs font-medium sm:text-sm">
            {reference ?? "—"}
          </dd>
        </div>
        {link.paymentNotes && (
          <div className="sm:col-span-2">
            <dt className="text-muted">Payment notes</dt>
            <dd className="mt-0.5 whitespace-pre-wrap">{link.paymentNotes}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
