import { NextResponse } from "next/server";
import { getMetaAppBySlug } from "@/lib/instagram/repository";
import { listMetaApps, upsertAccount } from "@/lib/instagram/repository";
import { instagramOAuthRedirectBase } from "@/lib/instagram/oauth-url";
import { verifyInstagramOAuthState } from "@/lib/instagram/oauth-state";

export const dynamic = "force-dynamic";

async function exchangeCodeForToken(input: {
  metaAppId: string;
  appSecret: string;
  code: string;
  redirectUri: string;
}): Promise<{ access_token: string }> {
  const url = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  url.searchParams.set("client_id", input.metaAppId);
  url.searchParams.set("client_secret", input.appSecret);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("code", input.code);
  const res = await fetch(url.toString());
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = json.error as { message?: string } | undefined;
    throw new Error(err?.message ?? "Token exchange failed");
  }
  return json as { access_token: string };
}

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
    return fail("Invalid or expired OAuth state");
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

  const redirectUri = instagramOAuthRedirectBase();

  try {
    const tokens = await exchangeCodeForToken({
      metaAppId: appWithSecret.metaAppId,
      appSecret: appWithSecret.appSecret,
      code,
      redirectUri,
    });

    const meUrl = new URL("https://graph.facebook.com/v21.0/me/accounts");
    meUrl.searchParams.set("access_token", tokens.access_token);
    const meRes = await fetch(meUrl.toString());
    const meJson = (await meRes.json()) as Record<string, unknown>;
    if (!meRes.ok) {
      throw new Error("Could not load Facebook pages for this token");
    }

    const data = Array.isArray(meJson.data) ? meJson.data : [];
    const page = data[0] as Record<string, unknown> | undefined;
    const pageAccessToken = page ? String(page.access_token ?? "") : tokens.access_token;
    const igUrl = page
      ? `https://graph.facebook.com/v21.0/${String(page.id)}?fields=instagram_business_account&access_token=${encodeURIComponent(pageAccessToken)}`
      : null;

    let igUserId = "";
    let username: string | null = null;

    if (igUrl) {
      const igRes = await fetch(igUrl);
      const igJson = (await igRes.json()) as Record<string, unknown>;
      const iba = igJson.instagram_business_account as { id?: string } | undefined;
      igUserId = iba?.id ? String(iba.id) : "";
      if (igUserId) {
        const profRes = await fetch(
          `https://graph.instagram.com/v21.0/${igUserId}?fields=username&access_token=${encodeURIComponent(pageAccessToken)}`,
        );
        const prof = (await profRes.json()) as { username?: string };
        username = prof.username ?? null;
      }
    }

    if (!igUserId) {
      return fail(
        "No Instagram Business account linked to this Facebook user. Connect IG to a Page first.",
      );
    }

    await upsertAccount({
      metaAppId: statePayload.metaAppRowId,
      igUserId,
      username,
      accessToken: pageAccessToken,
    });

    return NextResponse.redirect(new URL("/admin/growth/instagram?oauth=ok", request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth failed";
    return fail(message);
  }
}