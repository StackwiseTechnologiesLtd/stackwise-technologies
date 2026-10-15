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

/** Whether a KPay API key is sandbox/test mode. */
export function isKPayTestKey(apiKey: string): boolean {
  return apiKey.includes("_test_") || apiKey.startsWith("kpay_test");
}

/** Whether the configured KPay API key is sandbox/test mode. */
export function isKPayTestMode(): boolean {
  return isKPayTestKey(process.env.KPAY_API_KEY ?? "");
}

/** Credentials for a specific environment (live vs test wallet). */
export function getKPayCredentials(
  environment: PaymentEnvironment,
): { apiKey: string; secretKey: string } | null {
  const liveApi = process.env.KPAY_LIVE_API_KEY?.trim();
  const liveSecret = process.env.KPAY_LIVE_SECRET_KEY?.trim();
  const testApi = process.env.KPAY_TEST_API_KEY?.trim();
  const testSecret = process.env.KPAY_TEST_SECRET_KEY?.trim();
  const defaultApi = process.env.KPAY_API_KEY?.trim() ?? "";
  const defaultSecret = process.env.KPAY_SECRET_KEY?.trim() ?? "";
  const defaultIsTest = isKPayTestKey(defaultApi);

  if (environment === "production") {
    const apiKey = liveApi || (!defaultIsTest ? defaultApi : "");
    const secretKey = liveSecret || (!defaultIsTest ? defaultSecret : "");
    if (!apiKey || !secretKey) return null;
    return { apiKey, secretKey };
  }

  const apiKey = testApi || (defaultIsTest ? defaultApi : "");
  const secretKey = testSecret || (defaultIsTest ? defaultSecret : "");
  if (!apiKey || !secretKey) return null;
  return { apiKey, secretKey };
}

/** Only links explicitly marked live (kpay_is_test = false) are production. */
export function resolvePaymentEnvironment(link: PaymentLink): PaymentEnvironment {
  return link.kpayIsTest === false ? "production" : "test";
}

export function isLivePaymentLink(link: PaymentLink): boolean {
  return link.kpayIsTest === false;
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
