import type { KPayInitGatewayParams } from "@/lib/kpay/client";
import type { PaymentLink } from "@/lib/payments/types";

export type CheckoutPaymentMethod = "CARD" | "MOBILE_MONEY";

/** KPay card rail limit (USD). Mobile money uses local currency amounts. */
export const KPAY_CARD_MAX_USD = 874.5;

export function buildGatewayInitPayload(
  link: PaymentLink,
  method: CheckoutPaymentMethod,
  urls: { returnUrl: string; cancelUrl: string },
): KPayInitGatewayParams {
  const metadata = {
    invoiceNumber: link.invoiceNumber,
    slug: link.slug,
    amountUsd: link.amountUsd,
    amountLocal: link.amountLocal,
    localCurrency: link.currency,
    checkout_payment_method: method,
  };

  if (method === "CARD") {
    if (link.amountUsd > KPAY_CARD_MAX_USD) {
      throw new Error(
        `Card payments are limited to $${KPAY_CARD_MAX_USD} USD. Reduce the invoice total or pay with Mobile Money.`,
      );
    }

    return {
      amount: link.amountUsd,
      externalId: link.id,
      returnUrl: urls.returnUrl,
      cancelUrl: urls.cancelUrl,
      description: `Invoice ${link.invoiceNumber} — Stackwise Technologies`,
      paymentMethod: "CARD",
      metadata: {
        ...metadata,
        kpay_charge_amount: link.amountUsd,
        kpay_charge_currency: "USD",
      },
    };
  }

  return {
    amount: link.amountLocal,
    externalId: link.id,
    returnUrl: urls.returnUrl,
    cancelUrl: urls.cancelUrl,
    description: `Invoice ${link.invoiceNumber} — Stackwise Technologies`,
    metadata: {
      ...metadata,
      kpay_charge_amount: link.amountLocal,
      kpay_charge_currency: link.currency,
    },
  };
}
