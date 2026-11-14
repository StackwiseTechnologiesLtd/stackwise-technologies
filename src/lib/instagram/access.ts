import { isAllowedAdminEmail, normalizeAdminEmail } from "@/lib/otp/identity";
import { getInstagramGrantForEmail } from "@/lib/instagram/grants-repository";
import { listAccounts } from "@/lib/instagram/repository";

export type InstagramAccess = {
  kind: "owner" | "operator";
  email: string;
  /** Owners: null = all accounts. Operators: explicit id list (never null). */
  accountIds: string[] | null;
  canManageMetaApps: boolean;
  canManageTeam: boolean;
};

export async function getInstagramAccessForEmail(
  email: string,
): Promise<InstagramAccess | null> {
  const normalized = normalizeAdminEmail(email);
  if (!normalized) return null;

  if (isAllowedAdminEmail(normalized)) {
    return {
      kind: "owner",
      email: normalized,
      accountIds: null,
      canManageMetaApps: true,
      canManageTeam: true,
    };
  }

  const grant = await getInstagramGrantForEmail(normalized);
  if (!grant) return null;

  let accountIds: string[];
  if (grant.instagramAccountId) {
    accountIds = [grant.instagramAccountId];
  } else {
    const active = (await listAccounts()).filter((a) => a.status === "active");
    accountIds = active.map((a) => a.id);
  }

  return {
    kind: "operator",
    email: normalized,
    accountIds,
    canManageMetaApps: false,
    canManageTeam: false,
  };
}

export async function isAllowedAdminOrInstagramLogin(email: string): Promise<boolean> {
  const normalized = normalizeAdminEmail(email);
  if (!normalized) return false;
  if (isAllowedAdminEmail(normalized)) return true;
  const grant = await getInstagramGrantForEmail(normalized);
  return Boolean(grant);
}

export function accountAllowed(
  access: InstagramAccess,
  accountId: string,
): boolean {
  if (!access.accountIds) return true;
  return access.accountIds.includes(accountId);
}

export function filterByAccountAccess<T extends { id: string }>(
  items: T[],
  access: InstagramAccess,
): T[] {
  if (!access.accountIds) return items;
  return items.filter((item) => access.accountIds!.includes(item.id));
}

export function filterCampaignsByAccountAccess<
  T extends { accountId: string },
>(items: T[], access: InstagramAccess): T[] {
  if (!access.accountIds) return items;
  return items.filter((item) => access.accountIds!.includes(item.accountId));
}