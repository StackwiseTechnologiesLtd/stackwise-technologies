import { isPaystackConfigured } from "@/lib/paystack/environment";

const DEFAULT_PAYSTACK_CURRENCIES = ["KES"];

/** Currencies this Paystack merchant can charge (from PAYSTACK_CURRENCIES). */
export function getPaystackChargeCurrencies(): string[] {
  if (!isPaystackConfigured()) return [];

  const raw = process.env.PAYSTACK_CURRENCIES?.trim();
  if (!raw) return DEFAULT_PAYSTACK_CURRENCIES;

  const codes = raw
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);

  return codes.length > 0 ? codes : DEFAULT_PAYSTACK_CURRENCIES;
}
