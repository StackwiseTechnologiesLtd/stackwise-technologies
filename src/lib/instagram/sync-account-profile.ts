import { getInstagramProfessionalUser } from "@/lib/instagram/meta-oauth";
import {
  applyInstagramAccountProfileFromGraph,
  getAccountAccessToken,
  needsInstagramAccountProfileSync,
} from "@/lib/instagram/repository";

const DEFAULT_PROFILE_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;

export type InstagramAccountProfileSyncResult =
  | { synced: true; username: string | null }
  | { synced: false; reason: "no_token" | "throttled" | "not_found" };

export async function refreshInstagramAccountProfile(
  accountId: string,
): Promise<InstagramAccountProfileSyncResult> {
  const token = await getAccountAccessToken(accountId);
  if (!token) return { synced: false, reason: "no_token" };

  const profile = await getInstagramProfessionalUser(token);
  const username = profile.username ?? profile.name ?? null;
  const applied = await applyInstagramAccountProfileFromGraph(accountId, {
    username,
    igUserId: profile.userId,
  });
  if (!applied) return { synced: false, reason: "not_found" };
  return { synced: true, username };
}

export async function maybeRefreshInstagramAccountProfile(
  accountId: string,
  intervalMs = DEFAULT_PROFILE_SYNC_INTERVAL_MS,
): Promise<void> {
  const stale = await needsInstagramAccountProfileSync(accountId, intervalMs);
  if (!stale) return;
  try {
    await refreshInstagramAccountProfile(accountId);
  } catch (error) {
    console.warn("[instagram] profile sync failed:", accountId, error);
  }
}