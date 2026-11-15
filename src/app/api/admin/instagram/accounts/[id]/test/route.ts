import { NextResponse } from "next/server";
import { filterByAccountAccess } from "@/lib/instagram/access";
import {
  isInstagramApiError,
  requireAccountScope,
  requireInstagramApiAccess,
} from "@/lib/instagram/api-auth";
import { debugInstagramToken } from "@/lib/instagram/meta-oauth";
import {
  getAccountAccessToken,
  getMetaAppById,
  listAccounts,
} from "@/lib/instagram/repository";
import { refreshInstagramAccountProfile } from "@/lib/instagram/sync-account-profile";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteParams) {
  const ctx = await requireInstagramApiAccess({ manageMeta: true });
  if (isInstagramApiError(ctx)) return ctx;

  const { id } = await context.params;
  const account = filterByAccountAccess(await listAccounts(), ctx.access).find(
    (a) => a.id === id,
  );
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  const scopeErr = requireAccountScope(ctx.access, account.id);
  if (scopeErr) return scopeErr;

  const token = await getAccountAccessToken(id);
  if (!token) {
    return NextResponse.json(
      { ok: false, detail: "No token on account" },
      { status: 404 },
    );
  }

  const metaApp = await getMetaAppById(account.metaAppId);
  const result = await debugInstagramToken(
    token,
    metaApp
      ? { metaAppId: metaApp.metaAppId, appSecret: metaApp.appSecret }
      : undefined,
  );

  let username: string | null = account.username;
  if (result.ok) {
    try {
      const profile = await refreshInstagramAccountProfile(id);
      if (profile.synced) username = profile.username;
    } catch (error) {
      console.warn("[instagram] test token profile sync:", error);
    }
  }

  return NextResponse.json(
    { ...result, username },
    { status: result.ok ? 200 : 422 },
  );
}