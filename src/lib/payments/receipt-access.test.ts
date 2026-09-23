import { describe, expect, it } from "vitest";
import { canAccessReceipt } from "@/lib/payments/receipt-access";
import type { PaymentLink } from "@/lib/payments/types";

function link(status: PaymentLink["status"]): PaymentLink {
  return {
    id: "id",
    slug: "slug",
    customerName: "Customer",
    customerEmail: "c@example.com",
    currency: "KES",
    amountUsd: 100,
    amountLocal: 12900,
    exchangeRate: 129,
    status,
    lineItems: [],
    notes: null,
    kpayPaymentId: null,
    kpayReference: null,
    kpayIsTest: false,
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
  };
}

describe("canAccessReceipt", () => {
  it("allows paid links", () => {
    expect(canAccessReceipt(link("PAID"))).toBe(true);
  });

  it("denies unpaid links", () => {
    expect(canAccessReceipt(link("DRAFT"))).toBe(false);
    expect(canAccessReceipt(link("PENDING"))).toBe(false);
  });
});
