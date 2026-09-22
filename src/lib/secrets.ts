/** Shared server secret — prefers KPay webhook secret already in env. */
export function getAppSecret(): string {
  const secret =
    process.env.KPAY_WEBHOOK_SECRET ?? process.env.KPAY_SECRET_KEY ?? "";
  if (secret.length < 32) {
    throw new Error("KPAY_WEBHOOK_SECRET or KPAY_SECRET_KEY must be configured");
  }
  return secret;
}
