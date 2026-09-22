import { afterEach, describe, expect, it } from "vitest";
import type { PaymentLink } from "@/lib/payments/types";
import {
  partitionPaymentLinks,
  resolvePaymentEnvironment,
  summarizePaymentLinks,
} from "@/lib/kpay/environment";

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
    invoiceNumber: "SW-2026-0001",
    sentAt: null,
    paidAt: null,
    receiptSentAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...partial,
  };
}

describe("resolvePaymentEnvironment", () => {
  afterEach(() => {
    delete process.env.KPAY_API_KEY;
  });

  it("uses stored live flag", () => {
    expect(resolvePaymentEnvironment(link({ kpayIsTest: false }))).toBe(
      "production",
    );
  });

  it("uses stored test flag", () => {
    expect(resolvePaymentEnvironment(link({ kpayIsTest: true }))).toBe("test");
  });

  it("treats legacy initiated links without a flag as test", () => {
    process.env.KPAY_API_KEY = "kpay_live_abc";
    expect(
      resolvePaymentEnvironment(
        link({ kpayIsTest: null, kpayPaymentId: "pay_123" }),
      ),
    ).toBe("test");
  });

  it("assigns draft links to current key mode", () => {
    process.env.KPAY_API_KEY = "kpay_live_abc";
    expect(resolvePaymentEnvironment(link({ kpayIsTest: null }))).toBe(
      "production",
    );

    process.env.KPAY_API_KEY = "kpay_test_abc";
    expect(resolvePaymentEnvironment(link({ kpayIsTest: null }))).toBe("test");
  });
});

describe("partitionPaymentLinks", () => {
  it("splits live and test links", () => {
    const { production, test } = partitionPaymentLinks([
      link({ id: "1", kpayIsTest: false }),
      link({ id: "2", kpayIsTest: true }),
    ]);
    expect(production).toHaveLength(1);
    expect(test).toHaveLength(1);
  });
});

describe("summarizePaymentLinks", () => {
  it("totals USD and local amounts", () => {
    const summary = summarizePaymentLinks([
      link({ amountUsd: 100, amountLocal: 12900, status: "PAID" }),
      link({
        id: "2",
        amountUsd: 50,
        amountLocal: 6450,
        status: "DRAFT",
      }),
    ]);

    expect(summary.count).toBe(2);
    expect(summary.totalUsd).toBe(150);
    expect(summary.paidUsd).toBe(100);
    expect(summary.paidCount).toBe(1);
    expect(summary.localByCurrency.KES.total).toBe(19350);
    expect(summary.localByCurrency.KES.paid).toBe(12900);
  });
});
