import { NextResponse } from "next/server";
import {
  exchangeCodeForUserToken,
  exchangeLongLivedUserToken,
  listFacebookPagesWithInstagram,
  pickFacebookPage,
} from "@/lib/instagram/meta-oauth";
import { instagramOAuthRedirectBase } from "@/lib/instagram/oauth-url";
import { verifyInstagramOAuthState } from "@/lib/instagram/oauth-state";
import {
  getMetaAppBySlug,
  listMetaApps,
  upsertAccount,
} from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  const fail = (message: string) =>
    NextResponse.redirect(
      new URL(
        `/admin/growth/instagram?oauth_error=${encodeURIComponent(message)}`,
        request.url,
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

  const apps = await listMetaApps();
  const appMeta = apps.find((a) => a.id === statePayload.metaAppRowId);
  if (!appMeta) {
    return fail("Meta app not found");
  }

  const appWithSecret = await getMetaAppBySlug(appMeta.slug);
  if (!appWithSecret) {
    return fail("App credentials missing");
  }

  const redirectUri = instagramOAuthRedirectBase(request);
  const preferredPageId =
    process.env.INSTAGRAM_FACEBOOK_PAGE_ID?.trim() || null;

  try {
    const short = await exchangeCodeForUserToken({
      metaAppId: appWithSecret.metaAppId,
      appSecret: appWithSecret.appSecret,
      code,
      redirectUri,
    });

    const long = await exchangeLongLivedUserToken({
      metaAppId: appWithSecret.metaAppId,
      appSecret: appWithSecret.appSecret,
      shortLivedToken: short.accessToken,
    });

    const pages = await listFacebookPagesWithInstagram(long.accessToken);
    const page = pickFacebookPage(pages, preferredPageId);

    if (!page) {
      if (pages.length > 1) {
        const names = pages.map((p) => `${p.pageName} (${p.pageId})`).join(", ");
        return fail(
          `Several Facebook Pages have Instagram linked. Set INSTAGRAM_FACEBOOK_PAGE_ID to one of: ${names}`,
        );
      }
      return fail(
        "No Instagram Business account found. Link IG to a Facebook Page, then try Connect again.",
      );
    }

    const expiresAt =
      long.expiresIn != null
        ? new Date(Date.now() + long.expiresIn * 1000).toISOString()
        : null;

    await upsertAccount({
      metaAppId: statePayload.metaAppRowId,
      igUserId: page.igUserId,
      username: page.igUsername,
      accessToken: page.pageAccessToken,
      tokenExpiresAt: expiresAt,
    });

    const qs = new URLSearchParams({
      oauth: "ok",
      ig: page.igUsername ?? page.igUserId,
    });
    return NextResponse.redirect(
      new URL(`/admin/growth/instagram?${qs.toString()}`, request.url),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth failed";
    return fail(message);
  }
}