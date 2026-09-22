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
  patch: Partial<Pick<PaymentLink, "kpayReference" | "paidAt">>,
): Promise<PaymentLink | null> {
  const link = await getPaymentLinkById(linkId);
  if (!link) return null;

  const updated = await savePaymentLink({
    ...link,
    status: "PAID",
    paidAt: patch.paidAt ?? link.paidAt ?? Date.now(),
    kpayReference: patch.kpayReference ?? link.kpayReference,
    updatedAt: Date.now(),
  });

  return maybeSendPaymentReceipts(updated);
}
