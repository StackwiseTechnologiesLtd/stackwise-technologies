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
    invoiceNumber: "STL-550e8400-e29b-41d4-a716-446655440000",
    sentAt: null,
    paidAt: null,
    receiptSentAt: null,
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
