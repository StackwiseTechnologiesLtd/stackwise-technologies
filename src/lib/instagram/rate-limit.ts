import { countRecentAccountDeliveries } from "@/lib/instagram/repository";

const DEFAULT_PER_MINUTE = 30;

export function instagramRateLimitPerMinute(): number {
  const raw = Number(process.env.INSTAGRAM_RATE_LIMIT_PER_MINUTE ?? DEFAULT_PER_MINUTE);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_PER_MINUTE;
}

export async function isInstagramAccountRateLimited(
  accountId: string,
): Promise<boolean> {
  const limit = instagramRateLimitPerMinute();
  const count = await countRecentAccountDeliveries(accountId, 60);
  return count >= limit;
}