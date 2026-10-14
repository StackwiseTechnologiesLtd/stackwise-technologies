export function getPaystackSecretKey(): string | null {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  return key ? key : null;
}

/** Card checkout uses Paystack when a secret key is configured. */
export function isPaystackConfigured(): boolean {
  return getPaystackSecretKey() !== null;
}

/** Live keys start with sk_live_. Anything else is treated as sandbox. */
export function isPaystackTestKey(secretKey: string): boolean {
  return !secretKey.startsWith("sk_live_");
}

export function isPaystackTestMode(): boolean {
  return isPaystackTestKey(getPaystackSecretKey() ?? "");
}
