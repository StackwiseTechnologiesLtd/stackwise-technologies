import { afterEach, describe, expect, it } from "vitest";
import { verifyPaystackSignature } from "@/lib/paystack/client";
import {
  buildPaystackInitializeBody,
  createPaystackReference,
  paystackChargeMatchesLink,
  readPaystackLinkId,
  toPaystackSubunit,
} from "@/lib/paystack/checkout";
import {
  isPaystackConfigured,
  isPaystackTestMode,
} from "@/lib/paystack/environment";
import { cardCheckoutProcessor } from "@/lib/payments/processor";
import type { PaymentLink } from "@/lib/payments/types";

function link(partial: Partial<PaymentLink> = {}): PaymentLink {
  return {
    id: "link-id",
    slug: "abc123",
    customerName: "Customer",
    customerEmail: "c@example.com",
    currency: "KES",
    amountUsd: 25,
    amountLocal: 3225,
    exchangeRate: 129,
    status: "PENDING",
    lineItems: [],
    notes: null,
    kpayPaymentId: null,
    kpayReference: null,
    kpayIsTest: false,
    paystackReference: "ps-abc123-ref",
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

describe("toPaystackSubunit", () => {
  it("converts USD to cents", () => {
    expect(toPaystackSubunit(25)).toBe(2500);
    expect(toPaystackSubunit(10.1)).toBe(1010);
  });
});

describe("createPaystackReference", () => {
  it("uses Paystack-safe characters", () => {
    const reference = createPaystackReference("abc123");
    expect(reference).toMatch(/^ps-abc123-[a-z0-9]+$/);
  });
});

describe("paystackChargeMatchesLink", () => {
  const invoice = link();

  it("accepts a matching reference and amount", () => {
    expect(
      paystackChargeMatchesLink(
        {
          amount: 2500,
          currency: "USD",
          reference: "ps-abc123-ref",
          metadata: { linkId: "link-id" },
        },
        invoice,
      ),
    ).toBe(true);
  });

  it("accepts metadata link id when the stored reference changed", () => {
    expect(
      paystackChargeMatchesLink(
        {
          amount: 2500,
          currency: "usd",
          reference: "ps-abc123-other",
          metadata: { linkId: "link-id" },
        },
        invoice,
      ),
    ).toBe(true);
  });

  it("rejects a different amount or invoice", () => {
    expect(
      paystackChargeMatchesLink(
        {
          amount: 100,
          currency: "USD",
          reference: "ps-abc123-ref",
          metadata: { linkId: "link-id" },
        },
        invoice,
      ),
    ).toBe(false);
    expect(
      paystackChargeMatchesLink(
        {
          amount: 2500,
          currency: "USD",
          reference: "ps-abc123-ref",
          metadata: { linkId: "other-link" },
        },
        invoice,
      ),
    ).toBe(false);
  });
});

describe("readPaystackLinkId", () => {
  it("reads object and JSON-string metadata", () => {
    expect(readPaystackLinkId({ linkId: "link-id" })).toBe("link-id");
    expect(readPaystackLinkId('{"linkId":"link-id"}')).toBe("link-id");
    expect(readPaystackLinkId("not-json")).toBeNull();
  });
});

describe("buildPaystackInitializeBody", () => {
  it("charges the invoice in USD cents", () => {
    const body = buildPaystackInitializeBody(link(), "ps-abc123-ref", {
      returnUrl: "https://example.com/pay/abc123/return",
      cancelUrl: "https://example.com/pay/abc123",
    });
    expect(body.amount).toBe(2500);
    expect(body.currency).toBe("USD");
    expect(body.channels).toEqual(["card"]);
    expect(body.metadata.cancel_action).toBe("https://example.com/pay/abc123");
  });

  it("rejects amounts under one dollar", () => {
    expect(() =>
      buildPaystackInitializeBody(link({ amountUsd: 0.5 }), "ps-abc123-ref", {
        returnUrl: "https://example.com/return",
        cancelUrl: "https://example.com/pay",
      }),
    ).toThrow(/at least \$1\.00/);
  });
});

describe("Paystack environment", () => {
  const original = process.env.PAYSTACK_SECRET_KEY;

  afterEach(() => {
    if (original === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = original;
  });

  it("uses Paystack for cards only when the secret key is set", () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    expect(isPaystackConfigured()).toBe(false);
    expect(cardCheckoutProcessor()).toBe("KPAY");

    process.env.PAYSTACK_SECRET_KEY = "sk_test_example";
    expect(isPaystackConfigured()).toBe(true);
    expect(isPaystackTestMode()).toBe(true);
    expect(cardCheckoutProcessor()).toBe("PAYSTACK");

    process.env.PAYSTACK_SECRET_KEY = "sk_live_example";
    expect(isPaystackTestMode()).toBe(false);
  });
});

describe("verifyPaystackSignature", () => {
  it("accepts an HMAC SHA512 hex digest of the raw body", async () => {
    const secret = "sk_test_example";
    const rawBody = JSON.stringify({ event: "charge.success" });
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"],
    );
    const digest = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(rawBody),
    );
    const signature = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    expect(await verifyPaystackSignature(rawBody, signature, secret)).toBe(true);
    expect(await verifyPaystackSignature(rawBody, "00", secret)).toBe(false);
    expect(await verifyPaystackSignature(rawBody, signature, "")).toBe(false);
  });
});
