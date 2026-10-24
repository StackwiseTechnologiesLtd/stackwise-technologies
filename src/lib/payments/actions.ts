import { convertUsdToCurrency, localAmountFromUsd } from "@/lib/currency";
import { isKPayTestMode } from "@/lib/kpay/environment";
import {
  buildGatewayInitPayload,
  type CheckoutPaymentMethod,
} from "@/lib/kpay/buildGatewayInit";
import { initGatewayPayment, getPayment } from "@/lib/kpay/client";
import {
  buildPaystackInitializeBody,
  createPaystackReference,
  paystackChargeMatchesLink,
  readPaystackLinkId,
  type PaystackCharge,
} from "@/lib/paystack/checkout";
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
} from "@/lib/paystack/client";
import { getPaystackChargeCurrencies } from "@/lib/paystack/currencies";
import { isPaystackConfigured, isPaystackTestMode } from "@/lib/paystack/environment";
import { assertInvoiceCurrencyAllowed } from "@/lib/payments/invoice-currencies";
import { cardCheckoutProcessor } from "@/lib/payments/processor";
import {
  createId,
  createSlug,
  getPaymentLinkByExternalId,
  getPaymentLinkById,
  getPaymentLinkByPaystackReference,
  getPaymentLinkBySlug,
  nextInvoiceNumber,
  savePaymentLink,
} from "@/lib/db/payment-links";
import type { LineItem, PaymentLink } from "@/lib/payments/types";
import { finalizePaidPayment } from "@/lib/payments/receipts";
import {
  DEFAULT_PAYMENT_METHODS_OPTION,
  isCheckoutMethodAllowed,
  type PaymentMethodsOption,
} from "@/lib/payments/payment-methods";
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
  allowedPaymentMethods?: PaymentMethodsOption;
  contractEngagementId?: string | null;
};

export async function createPaymentLink(
  input: CreatePaymentLinkInput,
): Promise<PaymentLink> {
  const amountUsd = sumLineItemsUsd(input.lineItems);
  if (amountUsd <= 0) {
    throw new Error("Total amount must be greater than zero");
  }

  const allowedPaymentMethods =
    input.allowedPaymentMethods ?? DEFAULT_PAYMENT_METHODS_OPTION;
  assertInvoiceCurrencyAllowed(
    input.currency,
    allowedPaymentMethods,
    cardCheckoutProcessor(),
    getPaystackChargeCurrencies(),
  );

  const { rate } = await convertUsdToCurrency(amountUsd, input.currency);
  const amountLocal = localAmountFromUsd(amountUsd, rate, input.currency);
  if (amountLocal < 50 && input.currency === "XAF") {
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
    amountLocal,
    exchangeRate: rate,
    status: "DRAFT",
    lineItems: input.lineItems,
    notes: input.notes?.trim() ?? null,
    kpayPaymentId: null,
    kpayReference: null,
    kpayIsTest: isPaystackConfigured() ? isPaystackTestMode() : isKPayTestMode(),
    paystackReference: null,
    gatewayUrl: null,
    allowedPaymentMethods,
    invoiceNumber: await nextInvoiceNumber(),
    sentAt: null,
    paidAt: null,
    receiptSentAt: null,
    paymentSource: null,
    paymentMethod: null,
    amountReceivedUsd: null,
    amountReceivedLocal: null,
    collectedAt: null,
    paymentReference: null,
    paymentNotes: null,
    contractEngagementId: input.contractEngagementId ?? null,
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
  if (!isCheckoutMethodAllowed(link, method)) {
    throw new Error("This payment method is not available for this invoice");
  }

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
    paymentMethod: method === "CARD" ? "KPAY_CARD" : "KPAY_MOBILE_MONEY",
    updatedAt: Date.now(),
  };
  await savePaymentLink(updated);

  return { link: updated, gatewayUrl: payment.gatewayUrl };
}

export async function initiatePaystackPayment(slug: string): Promise<{
  link: PaymentLink;
  gatewayUrl: string;
}> {
  const link = await getPaymentLinkBySlug(slug);
  if (!link) throw new Error("Payment link not found");
  if (link.status === "PAID") throw new Error("This invoice is already paid");
  if (!isCheckoutMethodAllowed(link, "CARD", "PAYSTACK")) {
    throw new Error("This payment method is not available for this invoice");
  }

  const returnUrl = `${siteUrl()}/pay/${slug}/return`;
  const cancelUrl = `${siteUrl()}/pay/${slug}`;
  const reference = createPaystackReference(link.slug);
  let payment;
  try {
    payment = await initializePaystackTransaction(
      buildPaystackInitializeBody(link, reference, { returnUrl, cancelUrl }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "Invalid key") {
      throw new Error(
        "Card checkout is not available right now. Please try Mobile Money or contact Stackwise.",
      );
    }
    throw error;
  }

  if (!payment.authorization_url) {
    throw new Error("Paystack did not return a checkout URL");
  }

  const updated: PaymentLink = {
    ...link,
    status: "PENDING",
    paystackReference: payment.reference || reference,
    gatewayUrl: payment.authorization_url,
    paymentMethod: "PAYSTACK_CARD",
    updatedAt: Date.now(),
  };
  await savePaymentLink(updated);

  return { link: updated, gatewayUrl: payment.authorization_url };
}

export type PaystackConfirmResult =
  | { status: "paid"; link: PaymentLink }
  | { status: "failed"; link: PaymentLink }
  | { status: "abandoned"; link: PaymentLink }
  | { status: "pending"; link: PaymentLink }
  | { status: "ignored" }
  | { status: "not_found" };

function parsePaystackPaidAt(value: string | null | undefined): number {
  if (!value) return Date.now();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export async function applyVerifiedPaystackTransaction(
  charge: PaystackCharge,
): Promise<PaystackConfirmResult> {
  const metadataLinkId = readPaystackLinkId(charge.metadata);
  const link =
    (await getPaymentLinkByPaystackReference(charge.reference)) ??
    (metadataLinkId ? await getPaymentLinkById(metadataLinkId) : null);
  if (!link) return { status: "not_found" };
  if (link.status === "PAID") return { status: "paid", link };
  if (!paystackChargeMatchesLink(charge, link)) return { status: "ignored" };

  const chargeStatus = charge.status?.toLowerCase() ?? "";

  if (chargeStatus === "success") {
    const paid = await finalizePaidPayment(link.id, {
      paidAt: parsePaystackPaidAt(charge.paid_at),
      paymentSource: "PAYSTACK",
      paymentMethod: "PAYSTACK_CARD",
      paymentReference: charge.reference,
      paystackReference: charge.reference,
    });
    return paid ? { status: "paid", link: paid } : { status: "not_found" };
  }

  if (chargeStatus === "failed" && link.paystackReference === charge.reference) {
    const updated = await savePaymentLink({
      ...link,
      status: "FAILED",
      updatedAt: Date.now(),
    });
    return { status: "failed", link: updated };
  }

  if (chargeStatus === "abandoned") {
    return { status: "abandoned", link };
  }

  return { status: "pending", link };
}

export async function syncPaymentStatusFromPaystack(
  link: PaymentLink,
): Promise<PaymentLink> {
  if (!link.paystackReference || link.status === "PAID") return link;

  const charge = await verifyPaystackTransaction(link.paystackReference);
  const result = await applyVerifiedPaystackTransaction(charge);
  if (result.status === "paid" || result.status === "failed") return result.link;
  return link;
}

export async function syncPendingPayment(link: PaymentLink): Promise<PaymentLink> {
  if (link.status !== "PENDING") return link;

  let current = link;
  if (current.paystackReference) {
    try {
      current = await syncPaymentStatusFromPaystack(current);
      if (current.status === "PAID") return current;
    } catch {
      // Keep the invoice payable if Paystack verify is temporarily unavailable.
    }
  }

  if (current.kpayPaymentId) {
    return syncPaymentStatusFromKPay(current);
  }

  return current;
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
      paymentSource: "KPAY",
      paymentMethod:
        link.paymentMethod ??
        (link.allowedPaymentMethods === "MOBILE_MONEY"
          ? "KPAY_MOBILE_MONEY"
          : "KPAY_CARD"),
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
    return finalizePaidPayment(externalId, {
      paymentSource: "KPAY",
      paymentMethod:
        link.paymentMethod ??
        (link.allowedPaymentMethods === "MOBILE_MONEY"
          ? "KPAY_MOBILE_MONEY"
          : "KPAY_CARD"),
    });
  }

  const nextStatus = status === "FAILED" ? "FAILED" : "CANCELLED";
  return savePaymentLink({
    ...link,
    status: nextStatus,
    updatedAt: Date.now(),
  });
}
