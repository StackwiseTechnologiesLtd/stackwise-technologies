import { getPayment, verifyGatewayReturnSignature } from "@/lib/kpay/client";
import { getPaymentLinkBySlug } from "@/lib/db/payment-links";
import { finalizePaidPayment } from "@/lib/payments/receipts";
import type { PaymentLink } from "@/lib/payments/types";

export type GatewayReturnResult =
  | { outcome: "receipt" }
  | { outcome: "pay" }
  | { outcome: "cancelled" }
  | { outcome: "pending" };

export async function handleGatewayReturn(
  slug: string,
  query: Record<string, string | string[] | undefined>,
): Promise<{ link: PaymentLink; result: GatewayReturnResult } | null> {
  const link = await getPaymentLinkBySlug(slug);
  if (!link) return null;

  const status = String(query.status ?? "");
  const reference = String(query.reference ?? "");
  const externalId = String(query.externalId ?? "");
  const ts = String(query.ts ?? "");
  const sig = String(query.sig ?? "");

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
