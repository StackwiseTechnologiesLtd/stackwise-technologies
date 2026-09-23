import { describe, expect, it } from "vitest";
import { formatPaymentMethodLabel } from "@/lib/payments/manual-payment-methods";
import {
  paidAmountLocal,
  paidAmountUsd,
  validateManualPaymentInput,
  validatePaymentReference,
} from "@/lib/payments/manual-payment";
import type { PaymentLink } from "@/lib/payments/types";

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
    status: "SENT",
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
    ...partial,
  };
}

describe("validatePaymentReference", () => {
  it("accepts alphanumeric references", () => {
    expect(validatePaymentReference("TXN8F2K9A1")).toBe(true);
  });

  it("rejects symbols and spaces", () => {
    expect(validatePaymentReference("TXN-123")).toBe(false);
    expect(validatePaymentReference("")).toBe(false);
  });
});

describe("validateManualPaymentInput", () => {
  it("accepts valid input", () => {
    expect(
      validateManualPaymentInput({
        paymentMethod: "BANK_TRANSFER",
        amountReceivedUsd: 99,
        amountReceivedLocal: 12800,
        collectedAt: Date.now(),
        paymentReference: "REF123",
      }),
    ).toBeNull();
  });

  it("rejects invalid payment method", () => {
    expect(
      validateManualPaymentInput({
        paymentMethod: "BITCOIN" as "CASH",
        amountReceivedUsd: 99,
        amountReceivedLocal: 12800,
        collectedAt: Date.now(),
        paymentReference: "REF123",
      }),
    ).toBeTruthy();
  });
});

describe("paid amount helpers", () => {
  it("prefers received amounts when set", () => {
    const paid = link({
      amountReceivedUsd: 95,
      amountReceivedLocal: 12000,
    });
    expect(paidAmountUsd(paid)).toBe(95);
    expect(paidAmountLocal(paid)).toBe(12000);
  });

  it("falls back to invoice amounts", () => {
    const unpaid = link({});
    expect(paidAmountUsd(unpaid)).toBe(100);
    expect(paidAmountLocal(unpaid)).toBe(12900);
  });
});

describe("formatPaymentMethodLabel", () => {
  it("returns friendly labels", () => {
    expect(formatPaymentMethodLabel("BANK_TRANSFER")).toBe("Bank transfer");
  });
});
