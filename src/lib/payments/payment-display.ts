import type { PaymentLink } from "@/lib/payments/types";

/** Resolved USD amount shown on receipts (manual override or invoiced). */
export function paidAmountUsd(link: PaymentLink): number {
  return link.amountReceivedUsd ?? link.amountUsd;
}

/** Resolved local amount shown on receipts (manual override or invoiced). */
export function paidAmountLocal(link: PaymentLink): number {
  return link.amountReceivedLocal ?? link.amountLocal;
}

/** Customer-facing payment reference (manual or KPay). */
export function displayPaymentReference(link: PaymentLink): string | null {
  return link.paymentReference ?? link.kpayReference;
}
