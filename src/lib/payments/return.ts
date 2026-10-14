import { getPayment, verifyGatewayReturnSignature } from "@/lib/kpay/client";
import { verifyPaystackTransaction } from "@/lib/paystack/client";
import { getPaymentLinkBySlug } from "@/lib/db/payment-links";
import { applyVerifiedPaystackTransaction } from "@/lib/payments/actions";
import { finalizePaidPayment } from "@/lib/payments/receipts";
import type { PaymentLink } from "@/lib/payments/types";

export type GatewayReturnResult =
  | { outcome: "receipt" }
  | { outcome: "pay" }
  | { outcome: "cancelled" }
  | { outcome: "pending" };

function queryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

async function handlePaystackReturn(
  link: PaymentLink,
  reference: string,
): Promise<{ link: PaymentLink; result: GatewayReturnResult }> {
  try {
    const charge = await verifyPaystackTransaction(reference);
    const confirmed = await applyVerifiedPaystackTransaction(charge);
    if (confirmed.status === "paid") {
      return { link: confirmed.link, result: { outcome: "receipt" } };
    }
    if (confirmed.status === "failed") {
      return { link: confirmed.link, result: { outcome: "pay" } };
    }
    if (confirmed.status === "abandoned") {
      return { link: confirmed.link, result: { outcome: "cancelled" } };
    }
  } catch {
    return { link, result: { outcome: "pending" } };
  }

  return { link, result: { outcome: "pending" } };
}

export async function handleGatewayReturn(
  slug: string,
  query: Record<string, string | string[] | undefined>,
): Promise<{ link: PaymentLink; result: GatewayReturnResult } | null> {
  const link = await getPaymentLinkBySlug(slug);
  if (!link) return null;
  if (link.status === "PAID") {
    return { link, result: { outcome: "receipt" } };
  }

  const status = queryValue(query.status);
  const reference = queryValue(query.reference);
  const externalId = queryValue(query.externalId);
  const ts = queryValue(query.ts);
  const sig = queryValue(query.sig);
  const paystackReference = reference || queryValue(query.trxref);
  const looksLikeKPay =
    Boolean(sig) ||
    status === "COMPLETED" ||
    status === "CANCELLED" ||
    status === "FAILED";

  if (!looksLikeKPay && paystackReference) {
    return handlePaystackReturn(link, paystackReference);
  }

  const signatureValid = await verifyGatewayReturnSignature(
    status,
    reference,
    externalId,
    ts,
    sig,
  );

  if (signatureValid && status === "COMPLETED" && link.kpayPaymentId) {
    const payment = await getPayment(link.kpayPaymentId);
    if (payment.status === "COMPLETED") {
      const paid = await finalizePaidPayment(link.id, {
        kpayReference: reference,
        paymentSource: "KPAY",
        paymentMethod:
          link.paymentMethod ??
          (link.allowedPaymentMethods === "MOBILE_MONEY"
            ? "KPAY_MOBILE_MONEY"
            : "KPAY_CARD"),
      });
      if (paid) {
        return { link: paid, result: { outcome: "receipt" } };
      }
    }
  }

  if (status === "COMPLETED") {
    return { link, result: { outcome: "pay" } };
  }

  if (status === "CANCELLED") {
    return { link, result: { outcome: "cancelled" } };
  }

  return { link, result: { outcome: "pending" } };
}
