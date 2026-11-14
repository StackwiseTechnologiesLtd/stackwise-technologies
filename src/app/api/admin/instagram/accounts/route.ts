import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { prepareInstagramAccountToken } from "@/lib/instagram/save-account-token";
import { listAccounts, upsertAccount } from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const accounts = await listAccounts();
    return NextResponse.json({ accounts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
      const prepared = await prepareInstagramAccountToken({
        metaAppRowId: metaAppId,
        igUserId,
        username,
        accessToken,
        subscribeWebhooks,
      });
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

    const account = await upsertAccount({
      metaAppId,
      igUserId,
      username,
    });
    return NextResponse.json({ account });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}