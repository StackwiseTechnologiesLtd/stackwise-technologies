import { getPaymentLinkById, savePaymentLink } from "@/lib/db/payment-links";
import { logPaymentAudit } from "@/lib/db/payment-audit";
import { maybeSendPaymentReceipts } from "@/lib/payments/receipts";
import {
  isManualPaymentMethod,
  type ManualPaymentMethod,
} from "@/lib/payments/manual-payment-methods";
import type { PaymentLink } from "@/lib/payments/types";

export type RecordManualPaymentInput = {
  paymentMethod: ManualPaymentMethod;
  amountReceivedUsd: number;
  amountReceivedLocal: number;
  collectedAt: number;
  paymentReference: string;
  paymentNotes?: string | null;
  sendReceipt?: boolean;
};

const PAYMENT_REFERENCE_PATTERN = /^[A-Za-z0-9]{1,64}$/;

export function validatePaymentReference(reference: string): boolean {
  return PAYMENT_REFERENCE_PATTERN.test(reference.trim());
}

export function validateManualPaymentInput(input: RecordManualPaymentInput): string | null {
  if (!isManualPaymentMethod(input.paymentMethod)) {
    return "Invalid payment method";
  }
  if (!validatePaymentReference(input.paymentReference)) {
    return "Payment reference must be 1–64 alphanumeric characters";
  }
  if (!Number.isFinite(input.amountReceivedUsd) || input.amountReceivedUsd <= 0) {
    return "Amount received (USD) must be greater than zero";
  }
  if (!Number.isFinite(input.amountReceivedLocal) || input.amountReceivedLocal <= 0) {
    return "Amount received (local) must be greater than zero";
  }
  if (!Number.isFinite(input.collectedAt) || input.collectedAt <= 0) {
    return "Collection time is required";
  }
  return null;
}

export async function recordManualPayment(
  linkId: string,
  input: RecordManualPaymentInput,
  adminEmail?: string,
): Promise<PaymentLink> {
  const validationError = validateManualPaymentInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  const link = await getPaymentLinkById(linkId);
  if (!link) {
    throw new Error("Payment link not found");
  }
  if (link.status === "PAID") {
    throw new Error("This invoice is already marked as paid");
  }

  const now = Date.now();
  const updated: PaymentLink = {
    ...link,
    status: "PAID",
    paymentSource: "MANUAL",
    paymentMethod: input.paymentMethod,
    amountReceivedUsd: input.amountReceivedUsd,
    amountReceivedLocal: input.amountReceivedLocal,
    collectedAt: input.collectedAt,
    paymentReference: input.paymentReference.trim(),
    paymentNotes: input.paymentNotes?.trim() || null,
    paidAt: input.collectedAt,
    receiptSentAt: null,
    updatedAt: now,
  };

  await savePaymentLink(updated);

  await logPaymentAudit({
    paymentLinkId: linkId,
    event: "MANUAL_PAYMENT_RECORDED",
    metadata: {
      adminEmail: adminEmail ?? null,
      paymentMethod: input.paymentMethod,
      paymentReference: input.paymentReference.trim(),
      amountReceivedUsd: input.amountReceivedUsd,
    },
  });

  if (input.sendReceipt !== false) {
    return (await maybeSendPaymentReceipts(updated)) ?? updated;
  }

  return updated;
}

export async function resendPaymentReceipt(linkId: string): Promise<PaymentLink> {
  const link = await getPaymentLinkById(linkId);
  if (!link) {
    throw new Error("Payment link not found");
  }
  if (link.status !== "PAID") {
    throw new Error("Receipt is only available for paid invoices");
  }

  const cleared = await savePaymentLink({
    ...link,
    receiptSentAt: null,
    updatedAt: Date.now(),
  });

  return (await maybeSendPaymentReceipts(cleared)) ?? cleared;
}
