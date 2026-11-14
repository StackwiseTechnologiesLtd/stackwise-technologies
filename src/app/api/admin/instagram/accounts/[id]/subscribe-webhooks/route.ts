import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
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
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const account = (await listAccounts()).find((a) => a.id === id);
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

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