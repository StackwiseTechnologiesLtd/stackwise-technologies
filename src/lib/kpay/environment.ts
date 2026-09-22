import type { PaymentLink } from "@/lib/payments/types";

export type PaymentEnvironment = "test" | "production";

export type PaymentLinkSummary = {
  count: number;
  totalUsd: number;
  paidUsd: number;
  paidCount: number;
  localByCurrency: Record<
    string,
    { total: number; paid: number; paidCount: number }
  >;
};

/** Whether the configured KPay API key is sandbox/test mode. */
export function isKPayTestMode(): boolean {
  const key = process.env.KPAY_API_KEY ?? "";
  return key.includes("_test_") || key.startsWith("kpay_test");
}

/**
 * Resolved environment for a payment link.
 * Uses the stored KPay flag when set; draft links follow the current key mode;
 * legacy initiated links without a flag are treated as test (sandbox) data.
 */
export function resolvePaymentEnvironment(link: PaymentLink): PaymentEnvironment {
  if (link.kpayIsTest === true) return "test";
  if (link.kpayIsTest === false) return "production";
  if (!link.kpayPaymentId) {
    return isKPayTestMode() ? "test" : "production";
  }
  return "test";
}

export function partitionPaymentLinks(links: PaymentLink[]): {
  production: PaymentLink[];
  test: PaymentLink[];
} {
  const production: PaymentLink[] = [];
  const test: PaymentLink[] = [];

  for (const link of links) {
    if (resolvePaymentEnvironment(link) === "test") {
      test.push(link);
    } else {
      production.push(link);
    }
  }

  return { production, test };
}

export function summarizePaymentLinks(links: PaymentLink[]): PaymentLinkSummary {
  const summary: PaymentLinkSummary = {
    count: links.length,
    totalUsd: 0,
    paidUsd: 0,
    paidCount: 0,
    localByCurrency: {},
  };

  for (const link of links) {
    summary.totalUsd += link.amountUsd;
    const isPaid = link.status === "PAID";
    if (isPaid) {
      summary.paidUsd += link.amountUsd;
      summary.paidCount += 1;
    }

    const bucket = summary.localByCurrency[link.currency] ?? {
      total: 0,
      paid: 0,
      paidCount: 0,
    };
    bucket.total += link.amountLocal;
    if (isPaid) {
      bucket.paid += link.amountLocal;
      bucket.paidCount += 1;
    }
    summary.localByCurrency[link.currency] = bucket;
  }

  return summary;
}
