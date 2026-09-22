import { convertUsdToCurrency } from "@/lib/currency";
import {
  buildGatewayInitPayload,
  type CheckoutPaymentMethod,
} from "@/lib/kpay/buildGatewayInit";
import { initGatewayPayment, getPayment } from "@/lib/kpay/client";
import {
  createId,
  createSlug,
  getPaymentLinkByExternalId,
  getPaymentLinkBySlug,
  nextInvoiceNumber,
  savePaymentLink,
} from "@/lib/db/payment-links";
import type { LineItem, PaymentLink } from "@/lib/payments/types";
import { finalizePaidPayment } from "@/lib/payments/receipts";
import { sumLineItemsUsd } from "@/lib/services-catalog";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export type CreatePaymentLinkInput = {
  customerName: string;
  customerEmail: string;
  currency: string;
  lineItems: LineItem[];
  notes?: string;
  sendEmail?: boolean;
};

export async function createPaymentLink(
  input: CreatePaymentLinkInput,
): Promise<PaymentLink> {
  const amountUsd = sumLineItemsUsd(input.lineItems);
  if (amountUsd <= 0) {
    throw new Error("Total amount must be greater than zero");
  }

  const { amount, rate } = await convertUsdToCurrency(amountUsd, input.currency);
  if (amount < 50 && input.currency === "XAF") {
    throw new Error("Converted amount is below KPay minimum (50 XAF)");
  }

  const now = Date.now();
  const link: PaymentLink = {
    id: createId(),
    slug: createSlug(),
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail.trim().toLowerCase(),
    currency: input.currency,
    amountUsd,
    amountLocal: amount,
    exchangeRate: rate,
    status: "DRAFT",
    lineItems: input.lineItems,
    notes: input.notes?.trim() ?? null,
    kpayPaymentId: null,
    kpayReference: null,
    kpayIsTest: null,
    gatewayUrl: null,
    invoiceNumber: await nextInvoiceNumber(),
    sentAt: null,
    paidAt: null,
    receiptSentAt: null,
    createdAt: now,
    updatedAt: now,
  };

  return savePaymentLink(link);
}

export async function initiateKPayPayment(
  slug: string,
  method: CheckoutPaymentMethod,
): Promise<{
  link: PaymentLink;
  gatewayUrl: string;
}> {
  const link = await getPaymentLinkBySlug(slug);
  if (!link) throw new Error("Payment link not found");
  if (link.status === "PAID") throw new Error("This invoice is already paid");

  const returnUrl = `${siteUrl()}/pay/${slug}/return`;
  const cancelUrl = `${siteUrl()}/pay/${slug}`;

  const payment = await initGatewayPayment(
    buildGatewayInitPayload(link, method, { returnUrl, cancelUrl }),
  );

  const updated: PaymentLink = {
    ...link,
    status: "PENDING",
    kpayPaymentId: payment.id,
    kpayReference: payment.reference,
    kpayIsTest: payment.isTest,
    gatewayUrl: payment.gatewayUrl,
    updatedAt: Date.now(),
  };
  await savePaymentLink(updated);

  return { link: updated, gatewayUrl: payment.gatewayUrl };
}

export async function syncPaymentStatusFromKPay(
  link: PaymentLink,
): Promise<PaymentLink> {
  if (!link.kpayPaymentId) return link;

  const payment = await getPayment(link.kpayPaymentId);
  let status = link.status;
  const paidAt = link.paidAt;

  if (payment.status === "COMPLETED") {
    const paid = await finalizePaidPayment(link.id, {
      kpayReference: payment.reference,
      paidAt: paidAt ?? Date.now(),
    });
    return paid ?? link;
  } else if (payment.status === "FAILED") {
    status = "FAILED";
  } else if (payment.status === "CANCELLED") {
    status = "CANCELLED";
  } else if (payment.status === "PENDING" || payment.status === "PROCESSING") {
    status = "PENDING";
  }

  if (status === link.status && paidAt === link.paidAt) return link;

  const updated = {
    ...link,
    status,
    paidAt,
    kpayReference: payment.reference,
    updatedAt: Date.now(),
  };
  return savePaymentLink(updated);
}

export async function markPaymentFromWebhook(
  externalId: string,
  status: "COMPLETED" | "FAILED" | "CANCELLED",
): Promise<PaymentLink | null> {
  const link = await getPaymentLinkByExternalId(externalId);
  if (!link) return null;

  if (status === "COMPLETED") {
    return finalizePaidPayment(externalId, {});
  }

  const nextStatus = status === "FAILED" ? "FAILED" : "CANCELLED";
  return savePaymentLink({
    ...link,
    status: nextStatus,
    updatedAt: Date.now(),
  });
}
