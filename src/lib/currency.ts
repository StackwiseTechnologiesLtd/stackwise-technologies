import { getExchangeRate } from "@/lib/kpay/client";

const CFA_PEG = 655.957;
const NO_DECIMAL_CURRENCIES = new Set([
  "XAF",
  "XOF",
  "KES",
  "UGX",
  "RWF",
  "CDF",
]);

async function getFrankfurterRate(from: string, to: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { rates: Record<string, number> };
    return data.rates[to] ?? null;
  } catch {
    return null;
  }
}

export function roundForCurrency(amount: number, currency: string): number {
  if (NO_DECIMAL_CURRENCIES.has(currency)) {
    return Math.round(amount);
  }
  return Math.round(amount * 100) / 100;
}

/** Derive local amount from USD total and stored exchange rate. */
export function localAmountFromUsd(
  amountUsd: number,
  rate: number,
  currency: string,
): number {
  return roundForCurrency(amountUsd * rate, currency);
}

export async function convertUsdToCurrency(
  amountUsd: number,
  targetCurrency: string,
): Promise<{ amount: number; rate: number }> {
  if (targetCurrency === "USD") {
    return { amount: amountUsd, rate: 1 };
  }

  const kpayDirect = await getExchangeRate("USD", targetCurrency);
  if (kpayDirect) {
    return {
      amount: roundForCurrency(amountUsd * kpayDirect.rate, targetCurrency),
      rate: kpayDirect.rate,
    };
  }

  if (targetCurrency === "XAF" || targetCurrency === "XOF") {
    const usdToEur = await getFrankfurterRate("USD", "EUR");
    if (usdToEur) {
      const rate = usdToEur * CFA_PEG;
      return {
        amount: roundForCurrency(amountUsd * rate, targetCurrency),
        rate,
      };
    }
  }

  const kpayViaEur = await getExchangeRate("EUR", targetCurrency);
  const usdToEur = await getFrankfurterRate("USD", "EUR");
  if (kpayViaEur && usdToEur) {
    const rate = usdToEur * kpayViaEur.rate;
    return {
      amount: roundForCurrency(amountUsd * rate, targetCurrency),
      rate,
    };
  }

  const frankfurter = await getFrankfurterRate("USD", targetCurrency);
  if (frankfurter) {
    return {
      amount: roundForCurrency(amountUsd * frankfurter, targetCurrency),
      rate: frankfurter,
    };
  }

  throw new Error(`Unable to convert USD to ${targetCurrency}`);
}

export function formatMoney(amount: number, currency: string, locale = "en-US"): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: NO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(locale)} ${currency}`;
  }
}
