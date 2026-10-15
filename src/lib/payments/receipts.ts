import { sendPaymentReceiptEmails } from "@/lib/emails/payments";
import { getPaymentLinkById, savePaymentLink } from "@/lib/db/payment-links";
import type { PaymentLink } from "@/lib/payments/types";

export async function maybeSendPaymentReceipts(
  link: PaymentLink,
): Promise<PaymentLink> {
  if (link.status !== "PAID" || link.receiptSentAt) {
    return link;
  }

  await sendPaymentReceiptEmails(link);

  return savePaymentLink({
    ...link,
    receiptSentAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export async function finalizePaidPayment(
  linkId: string,
  patch: Partial<
    Pick<
      PaymentLink,
      | "kpayReference"
      | "paidAt"
      | "paymentSource"
      | "paymentMethod"
      | "paymentReference"
      | "paystackReference"
    >
  >,
): Promise<PaymentLink | null> {
  const link = await getPaymentLinkById(linkId);
  if (!link) return null;
  if (link.status === "PAID" && link.paymentSource === "MANUAL") {
    return link;
  }

  const updated = await savePaymentLink({
    ...link,
    status: "PAID",
    paidAt: patch.paidAt ?? link.paidAt ?? Date.now(),
    kpayReference: patch.kpayReference ?? link.kpayReference,
    paymentSource: patch.paymentSource ?? link.paymentSource,
    paymentMethod: patch.paymentMethod ?? link.paymentMethod,
    paymentReference: patch.paymentReference ?? link.paymentReference,
    paystackReference: patch.paystackReference ?? link.paystackReference,
    updatedAt: Date.now(),
  });

  return maybeSendPaymentReceipts(updated);
}
