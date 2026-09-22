import { describe, expect, it } from "vitest";
import { KPAY_CARD_MAX_USD } from "@/lib/kpay/buildGatewayInit";
import type { PaymentLink } from "@/lib/payments/types";
import {
  isCheckoutMethodAllowed,
  resolveCheckoutMethods,
} from "@/lib/payments/payment-methods";

function link(partial: Partial<PaymentLink>): PaymentLink {
  return {
    id: "id",
    slug: "slug",
    customerName: "Customer",
    customerEmail: "c@example.com",
    currency: "KES",
    amountUsd: 100,
    amountLocal: 12900,
    exchangeRate: 129,
    status: "DRAFT",
    lineItems: [],
    notes: null,
    kpayPaymentId: null,
    kpayReference: null,
    kpayIsTest: null,
    gatewayUrl: null,
    allowedPaymentMethods: "BOTH",
    invoiceNumber: "STL-550E8400",
    sentAt: null,
    paidAt: null,
    receiptSentAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...partial,
  };
}

describe("resolveCheckoutMethods", () => {
  it("returns both methods by default", () => {
    expect(resolveCheckoutMethods("BOTH")).toEqual(["CARD", "MOBILE_MONEY"]);
  });

  it("returns card only when configured", () => {
    expect(resolveCheckoutMethods("CARD")).toEqual(["CARD"]);
  });

  it("drops card when amount exceeds KPay card limit", () => {
    expect(resolveCheckoutMethods("BOTH", KPAY_CARD_MAX_USD + 1)).toEqual([
      "MOBILE_MONEY",
    ]);
  });
});

describe("isCheckoutMethodAllowed", () => {
  it("blocks card when invoice is card-only but over limit", () => {
    const invoice = link({
      allowedPaymentMethods: "CARD",
      amountUsd: KPAY_CARD_MAX_USD + 10,
    });
    expect(isCheckoutMethodAllowed(invoice, "CARD")).toBe(false);
    expect(isCheckoutMethodAllowed(invoice, "MOBILE_MONEY")).toBe(false);
  });
});
