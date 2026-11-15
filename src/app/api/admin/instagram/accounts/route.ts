import { NextResponse } from "next/server";
import { filterByAccountAccess } from "@/lib/instagram/access";
import {
  isInstagramApiError,
  requireAccountScope,
  requireInstagramApiAccess,
} from "@/lib/instagram/api-auth";
import { prepareInstagramAccountToken } from "@/lib/instagram/save-account-token";
import { listAccounts, upsertAccount } from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await requireInstagramApiAccess();
  if (isInstagramApiError(ctx)) return ctx;
  const url = new URL(request.url);
  const includeRemoved =
    url.searchParams.get("removed") === "1" && ctx.access.canManageMetaApps;
  try {
    const active = filterByAccountAccess(await listAccounts({ status: "active" }), ctx.access);
    const removed = includeRemoved
      ? filterByAccountAccess(await listAccounts({ status: "removed" }), ctx.access)
      : [];
    return NextResponse.json({ accounts: active, removedAccounts: removed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await requireInstagramApiAccess();
  if (isInstagramApiError(ctx)) return ctx;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const metaAppId = String(body.metaAppId ?? "").trim();
    const igUserId = String(body.igUserId ?? "").trim();
    const username = body.username ? String(body.username).trim() : null;
    const accessToken = body.accessToken
      ? String(body.accessToken).trim()
      : undefined;
    const subscribeWebhooks = body.subscribeWebhooks !== false;

    if (!metaAppId || !igUserId) {
      return NextResponse.json(
        { error: "metaAppId and igUserId required" },
        { status: 400 },
      );
    }

    if (accessToken) {
      if (!ctx.access.canManageMetaApps) {
        return NextResponse.json(
          { error: "Only owners can paste tokens" },
          { status: 403 },
        );
      }
      const prepared = await prepareInstagramAccountToken({
        metaAppRowId: metaAppId,
        igUserId,
        username,
        accessToken,
        subscribeWebhooks,
      });
      const scopeErr = requireAccountScope(ctx.access, prepared.igUserId);
      if (scopeErr) return scopeErr;

      const account = await upsertAccount({
        metaAppId,
        igUserId: prepared.igUserId,
        username: prepared.username,
        accessToken: prepared.accessToken,
        tokenExpiresAt: prepared.tokenExpiresAt,
        webhookSubscribed: prepared.webhookSubscribed,
      });
      return NextResponse.json({
        account,
        webhookSubscribed: prepared.webhookSubscribed,
      });
    }

    return NextResponse.json(
      { error: "accessToken required" },
      { status: 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}