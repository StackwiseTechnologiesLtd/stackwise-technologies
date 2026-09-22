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

const RATE_CACHE_MS = 60 * 60 * 1000;
const rateCache = new Map<string, { rate: number; at: number }>();

function cacheKey(from: string, to: string): string {
  return `${from}->${to}`;
}

function readCachedRate(from: string, to: string): number | null {
  const hit = rateCache.get(cacheKey(from, to));
  if (!hit) return null;
  if (Date.now() - hit.at > RATE_CACHE_MS) {
    rateCache.delete(cacheKey(from, to));
    return null;
  }
  return hit.rate;
}

function writeCachedRate(from: string, to: string, rate: number): void {
  rateCache.set(cacheKey(from, to), { rate, at: Date.now() });
}

async function getFrankfurterRate(from: string, to: string): Promise<number | null> {
  const cached = readCachedRate(from, to);
  if (cached != null) return cached;

  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { rates: Record<string, number> };
    const rate = data.rates[to] ?? null;
    if (rate != null) writeCachedRate(from, to, rate);
    return rate;
  } catch {
    return null;
  }
}

async function getKPayRate(from: string, to: string): Promise<number | null> {
  const cached = readCachedRate(`kpay:${from}`, to);
  if (cached != null) return cached;

  const result = await getExchangeRate(from, to);
  if (!result) return null;
  writeCachedRate(`kpay:${from}`, to, result.rate);
  return result.rate;
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

  if (targetCurrency === "XAF" || targetCurrency === "XOF") {
    const usdToEur = await getFrankfurterRate("USD", "EUR");
    if (usdToEur) {
      const rate = usdToEur * CFA_PEG;
      writeCachedRate("USD", targetCurrency, rate);
      return {
        amount: roundForCurrency(amountUsd * rate, targetCurrency),
        rate,
      };
    }
  }

  const [frankfurterRate, kpayUsdRate] = await Promise.all([
    getFrankfurterRate("USD", targetCurrency),
    getKPayRate("USD", targetCurrency),
  ]);

  if (kpayUsdRate) {
    return {
      amount: roundForCurrency(amountUsd * kpayUsdRate, targetCurrency),
      rate: kpayUsdRate,
    };
  }

  if (frankfurterRate) {
    return {
      amount: roundForCurrency(amountUsd * frankfurterRate, targetCurrency),
      rate: frankfurterRate,
    };
  }

  const [kpayEurRate, usdToEur] = await Promise.all([
    getKPayRate("EUR", targetCurrency),
    getFrankfurterRate("USD", "EUR"),
  ]);
  if (kpayEurRate && usdToEur) {
    const rate = usdToEur * kpayEurRate;
    writeCachedRate("USD", targetCurrency, rate);
    return {
      amount: roundForCurrency(amountUsd * rate, targetCurrency),
      rate,
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
