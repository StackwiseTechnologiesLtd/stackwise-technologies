import { describe, expect, it } from "vitest";
import type { PaymentLink } from "@/lib/payments/types";
import { formatLinkProcessorLine } from "@/lib/payments/payment-source";

function link(partial: Partial<PaymentLink>): PaymentLink {
  return {
    id: "id",
    slug: "slug",
    customerName: "Customer",
    customerEmail: "c@example.com",
    currency: "KES",
    amountUsd: 25,
    amountLocal: 3225,
    exchangeRate: 129,
    status: "SENT",
    lineItems: [],
    notes: null,
    kpayPaymentId: null,
    kpayReference: null,
    kpayIsTest: false,
    paystackReference: null,
    gatewayUrl: null,
    allowedPaymentMethods: "BOTH",
    invoiceNumber: "STL-550E8400",
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
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...partial,
  };
}

describe("formatLinkProcessorLine", () => {
  it("shows configured rails for open invoices", () => {
    expect(formatLinkProcessorLine(link({}), "PAYSTACK")).toBe(
      "Paystack · KPay",
    );
    expect(
      formatLinkProcessorLine(
        link({ allowedPaymentMethods: "MOBILE_MONEY" }),
        "PAYSTACK",
      ),
    ).toBe("KPay");
  });

  it("shows the processor used when paid", () => {
    expect(
      formatLinkProcessorLine(
        link({
          status: "PAID",
          paymentSource: "PAYSTACK",
          paystackReference: "ps-ref",
        }),
        "PAYSTACK",
      ),
    ).toBe("Paystack");
  });
});
