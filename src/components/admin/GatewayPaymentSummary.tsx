import { formatDateTime } from "@/lib/format-datetime";
import { formatPaymentMethodLabel } from "@/lib/payments/manual-payment-methods";
import { displayPaymentReference } from "@/lib/payments/payment-display";
import { formatPaymentSourceLabel } from "@/lib/payments/payment-source";
import type { PaymentLink } from "@/lib/payments/types";

function resolveGatewaySource(link: PaymentLink): "PAYSTACK" | "KPAY" | null {
  if (link.paymentSource === "PAYSTACK" || link.paymentSource === "KPAY") {
    return link.paymentSource;
  }
  if (link.paystackReference && !link.kpayPaymentId) return "PAYSTACK";
  if (link.kpayPaymentId && !link.paystackReference) return "KPAY";
  if (link.paystackReference) return "PAYSTACK";
  if (link.kpayPaymentId) return "KPAY";
  return null;
}

export function GatewayPaymentSummary({ link }: { link: PaymentLink }) {
  if (link.paymentSource === "MANUAL") return null;

  const gateway = resolveGatewaySource(link);
  if (!gateway) return null;

  const reference = displayPaymentReference(link);
  const showAttempt =
    link.status === "PENDING" ||
    link.status === "FAILED" ||
    link.status === "CANCELLED" ||
    link.status === "PAID";

  if (!showAttempt) return null;

  const title =
    link.status === "PAID"
      ? "Gateway payment"
      : link.status === "PENDING"
        ? "Checkout in progress"
        : "Last checkout attempt";

  const borderClass =
    link.status === "PAID"
      ? "border-emerald-900/40 bg-emerald-950/20"
      : link.status === "PENDING"
        ? "border-amber-900/40 bg-amber-950/20"
        : "border-line bg-panel";

  return (
    <section className={`rounded-xl border p-6 ${borderClass}`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Processor</dt>
          <dd className="mt-0.5 font-medium">
            {formatPaymentSourceLabel(gateway)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Status</dt>
          <dd className="mt-0.5 font-medium">{link.status}</dd>
        </div>
        {link.paymentMethod && (
          <div>
            <dt className="text-muted">Method</dt>
            <dd className="mt-0.5 font-medium">
              {formatPaymentMethodLabel(link.paymentMethod)}
            </dd>
          </div>
        )}
        {link.paidAt && (
          <div>
            <dt className="text-muted">Paid at</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {formatDateTime(link.paidAt)}
            </dd>
          </div>
        )}
        {reference && (
          <div className="sm:col-span-2">
            <dt className="text-muted">Reference</dt>
            <dd className="mt-0.5 font-mono text-xs font-medium sm:text-sm">
              {reference}
            </dd>
          </div>
        )}
        {gateway === "KPAY" && link.kpayPaymentId && (
          <div className="sm:col-span-2">
            <dt className="text-muted">KPay payment ID</dt>
            <dd className="mt-0.5 font-mono text-xs font-medium sm:text-sm">
              {link.kpayPaymentId}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
