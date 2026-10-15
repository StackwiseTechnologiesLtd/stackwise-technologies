import type { PaymentLink } from "@/lib/payments/types";

/** Minimum invoice total (USD) before card checkout is allowed. */
export const PAYSTACK_MIN_USD = 1;

const REFERENCE_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export type PaystackMetadata = {
  linkId?: string;
  slug?: string;
  invoiceNumber?: string;
  cancel_action?: string;
};

export type PaystackCharge = {
  amount: number;
  currency: string;
  reference: string;
  status: string;
  paid_at?: string | null;
  metadata?: unknown;
};

/** Paystack `amount` is in the currency minor unit (e.g. KES cents). */
export function toPaystackSubunit(amountMajor: number, _currency: string): number {
  if (!Number.isFinite(amountMajor) || amountMajor <= 0) {
    throw new Error("Invoice amount is invalid");
  }
  return Math.round(amountMajor * 100);
}

export function createPaystackReference(slug: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const suffix = Array.from(
    bytes,
    (byte) => REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length],
  ).join("");
  return `ps-${slug}-${suffix}`;
}

export function readPaystackLinkId(metadata: unknown): string | null {
  let value = metadata;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const linkId = (value as { linkId?: unknown }).linkId;
  return typeof linkId === "string" && linkId.length > 0 ? linkId : null;
}

export function paystackChargeMatchesLink(
  charge: Pick<PaystackCharge, "amount" | "currency" | "reference" | "metadata">,
  link: Pick<
    PaymentLink,
    "id" | "currency" | "amountLocal" | "paystackReference"
  >,
): boolean {
  if (charge.currency.toUpperCase() !== link.currency.toUpperCase()) return false;
  if (Number(charge.amount) !== toPaystackSubunit(link.amountLocal, link.currency)) {
    return false;
  }

  const linkId = readPaystackLinkId(charge.metadata);
  if (linkId && linkId !== link.id) return false;
  if (link.paystackReference === charge.reference) return true;
  return linkId === link.id;
}

export function buildPaystackInitializeBody(
  link: PaymentLink,
  reference: string,
  urls: { returnUrl: string; cancelUrl: string },
): {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  callback_url: string;
  channels: ["card"];
  metadata: PaystackMetadata;
} {
  if (link.amountUsd < PAYSTACK_MIN_USD) {
    throw new Error(
      `Card payments require at least $${PAYSTACK_MIN_USD.toFixed(2)} USD.`,
    );
  }

  return {
    email: link.customerEmail,
    amount: toPaystackSubunit(link.amountLocal, link.currency),
    currency: link.currency,
    reference,
    callback_url: urls.returnUrl,
    channels: ["card"],
    metadata: {
      linkId: link.id,
      slug: link.slug,
      invoiceNumber: link.invoiceNumber,
      cancel_action: urls.cancelUrl,
    },
  };
}
