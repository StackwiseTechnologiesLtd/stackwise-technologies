import { NextResponse } from "next/server";
import { filterByAccountAccess } from "@/lib/instagram/access";
import {
  isInstagramApiError,
  requireAccountScope,
  requireInstagramApiAccess,
} from "@/lib/instagram/api-auth";
import { subscribeInstagramAccountToWebhooks } from "@/lib/instagram/meta-oauth";
import {
  getAccountAccessToken,
  getAccountIgUserId,
  listAccounts,
  upsertAccount,
} from "@/lib/instagram/repository";

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
  const igUserId = await getAccountIgUserId(id);
  if (!token || !igUserId) {
    return NextResponse.json({ error: "No token on account" }, { status: 400 });
  }

  try {
    const sub = await subscribeInstagramAccountToWebhooks({
      instagramUserId: igUserId,
      accessToken: token,
    });
    await upsertAccount({
      metaAppId: account.metaAppId,
      igUserId: account.igUserId,
      webhookSubscribed: sub.success,
    });
    return NextResponse.json({
      ok: true,
      webhookSubscribed: sub.success,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Subscribe failed";
    return NextResponse.json({ ok: false, error: message }, { status: 422 });
  }
}