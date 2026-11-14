import { NextResponse } from "next/server";
import {
  exchangeInstagramCodeForToken,
  exchangeInstagramLongLivedToken,
  getInstagramProfessionalUser,
  normalizeInstagramOAuthCode,
  subscribeInstagramAccountToWebhooks,
} from "@/lib/instagram/meta-oauth";
import {
  instagramAdminReturnOrigin,
  instagramOAuthRedirectBase,
} from "@/lib/instagram/oauth-url";
import { verifyInstagramOAuthState } from "@/lib/instagram/oauth-state";
import { getMetaAppById, upsertAccount } from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = normalizeInstagramOAuthCode(url.searchParams.get("code"));
  const state = url.searchParams.get("state");
  const oauthError =
    url.searchParams.get("error_description") ?? url.searchParams.get("error");

  const returnOrigin = instagramAdminReturnOrigin(request);

  const fail = (message: string) =>
    NextResponse.redirect(
      new URL(
        `/admin/instagram/connection?oauth_error=${encodeURIComponent(message)}`,
        returnOrigin,
      ),
    );

  if (oauthError) {
    return fail(oauthError);
  }
  if (!code || !state) {
    return fail("Missing code or state");
  }

  const statePayload = await verifyInstagramOAuthState(state);
  if (!statePayload) {
    return fail("Invalid or expired OAuth state — click Connect again");
  }

  const appWithSecret = await getMetaAppById(statePayload.metaAppRowId);
  if (!appWithSecret) {
    return fail("Meta app not found or credentials missing");
  }

  const redirectUri = instagramOAuthRedirectBase(request);

  try {
    const short = await exchangeInstagramCodeForToken({
      instagramAppId: appWithSecret.metaAppId,
      appSecret: appWithSecret.appSecret,
      code,
      redirectUri,
    });

    const long = await exchangeInstagramLongLivedToken({
      shortLivedToken: short.accessToken,
      appSecret: appWithSecret.appSecret,
    });

    const profile = await getInstagramProfessionalUser(long.accessToken);
    const webhookIgId = profile.userId;

    let webhookSubscribed = false;
    try {
      const sub = await subscribeInstagramAccountToWebhooks({
        instagramUserId: webhookIgId,
        accessToken: long.accessToken,
      });
      webhookSubscribed = sub.success;
    } catch (subscriptionError) {
      console.warn("[instagram-oauth] Webhook subscription:", subscriptionError);
    }

    const expiresAt = new Date(
      Date.now() + long.expiresIn * 1000,
    ).toISOString();

    await upsertAccount({
      metaAppId: statePayload.metaAppRowId,
      igUserId: webhookIgId,
      username: profile.username,
      accessToken: long.accessToken,
      tokenExpiresAt: expiresAt,
      webhookSubscribed,
    });

    const qs = new URLSearchParams({
      oauth: "ok",
      ig: profile.username ?? webhookIgId,
    });
    return NextResponse.redirect(
      new URL(`/admin/instagram/connection?${qs.toString()}`, returnOrigin),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth failed";
    return fail(message);
  }
}