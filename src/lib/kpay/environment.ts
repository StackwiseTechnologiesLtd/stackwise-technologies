import type { PaymentLink } from "@/lib/payments/types";

export type PaymentEnvironment = "test" | "production";

/** Whether the configured KPay API key is sandbox/test mode. */
export function isKPayTestMode(): boolean {
  const key = process.env.KPAY_API_KEY ?? "";
  return key.includes("_test_") || key.startsWith("kpay_test");
}

/** Resolved environment for a payment link (stored KPay flag, else current key mode). */
export function resolvePaymentEnvironment(link: PaymentLink): PaymentEnvironment {
  if (link.kpayIsTest === true) return "test";
  if (link.kpayIsTest === false) return "production";
  return isKPayTestMode() ? "test" : "production";
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
