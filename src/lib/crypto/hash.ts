export async function hashString(value: string): Promise<string> {
  const salt = process.env.KPAY_SECRET_KEY ?? "";
  const data = new TextEncoder().encode(value + salt);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
