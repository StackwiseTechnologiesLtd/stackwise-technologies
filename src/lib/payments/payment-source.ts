import { resolveCheckoutMethods } from "@/lib/payments/payment-methods";
import type { CardProcessor } from "@/lib/payments/processor";
import type { PaymentLink, PaymentSource } from "@/lib/payments/types";

const SOURCE_LABELS: Record<PaymentSource, string> = {
  PAYSTACK: "Paystack",
  KPAY: "KPay",
  MANUAL: "Manual",
};

export function formatPaymentSourceLabel(
  source: PaymentSource | null | undefined,
): string {
  if (!source) return "—";
  return SOURCE_LABELS[source];
}

export function resolvePaymentSource(link: PaymentLink): PaymentSource | null {
  if (link.paymentSource) return link.paymentSource;
  if (link.status !== "PAID") return null;
  if (link.paystackReference && !link.kpayPaymentId) return "PAYSTACK";
  if (link.kpayReference || link.kpayPaymentId) return "KPAY";
  return null;
}

/** Customer-facing processor line for admin lists (paid, in-flight, or configured rails). */
export function formatLinkProcessorLine(
  link: PaymentLink,
  cardProcessor: CardProcessor,
): string {
  const paid = resolvePaymentSource(link);
  if (paid === "MANUAL") return SOURCE_LABELS.MANUAL;
  if (paid) return formatPaymentSourceLabel(paid);

  if (link.status === "PENDING" || link.status === "FAILED" || link.status === "CANCELLED") {
    if (link.paystackReference && !link.kpayPaymentId) return SOURCE_LABELS.PAYSTACK;
    if (link.kpayPaymentId && !link.paystackReference) return SOURCE_LABELS.KPAY;
    if (link.paystackReference) return SOURCE_LABELS.PAYSTACK;
    if (link.kpayPaymentId) return SOURCE_LABELS.KPAY;
  }

  const methods = resolveCheckoutMethods(
    link.allowedPaymentMethods,
    link.amountUsd,
    cardProcessor,
  );
  const labels: string[] = [];
  if (methods.includes("CARD")) {
    labels.push(cardProcessor === "PAYSTACK" ? SOURCE_LABELS.PAYSTACK : SOURCE_LABELS.KPAY);
  }
  if (methods.includes("MOBILE_MONEY")) {
    labels.push(SOURCE_LABELS.KPAY);
  }
  if (labels.length === 0) return "—";
  return [...new Set(labels)].join(" · ");
}
