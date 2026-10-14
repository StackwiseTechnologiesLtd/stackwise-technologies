import type { CardProcessor } from "@/lib/payments/processor";
import type { PaymentMethodsOption } from "@/lib/payments/payment-methods";
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/payments/types";

export function invoiceUsesPaystackCard(
  allowedPaymentMethods: PaymentMethodsOption,
  cardProcessor: CardProcessor,
): boolean {
  if (cardProcessor !== "PAYSTACK") return false;
  return (
    allowedPaymentMethods === "CARD" || allowedPaymentMethods === "BOTH"
  );
}

/** Currencies available when creating a payment link in admin. */
export function selectableInvoiceCurrencies(
  allowedPaymentMethods: PaymentMethodsOption,
  cardProcessor: CardProcessor,
  paystackCurrencies: string[],
): Array<(typeof SUPPORTED_CURRENCIES)[number]> {
  if (
    invoiceUsesPaystackCard(allowedPaymentMethods, cardProcessor) &&
    paystackCurrencies.length > 0
  ) {
    const allowed = new Set(
      paystackCurrencies.map((code) => code.toUpperCase()),
    );
    return SUPPORTED_CURRENCIES.filter((entry) => allowed.has(entry.code));
  }
  return [...SUPPORTED_CURRENCIES];
}

export function assertInvoiceCurrencyAllowed(
  currency: string,
  allowedPaymentMethods: PaymentMethodsOption,
  cardProcessor: CardProcessor,
  paystackCurrencies: string[],
): void {
  const options = selectableInvoiceCurrencies(
    allowedPaymentMethods,
    cardProcessor,
    paystackCurrencies,
  );
  const code = currency.toUpperCase() as SupportedCurrency;
  if (!options.some((entry) => entry.code === code)) {
    const labels = options.map((entry) => entry.code).join(", ");
    throw new Error(
      labels
        ? `Payment currency must be one of: ${labels}. Paystack card checkout only supports currencies enabled on your Paystack account.`
        : "Payment currency is not supported for this configuration.",
    );
  }
}
