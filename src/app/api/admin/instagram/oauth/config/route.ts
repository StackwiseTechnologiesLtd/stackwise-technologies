import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import {
  instagramOAuthRedirectBase,
  instagramOAuthScopes,
} from "@/lib/instagram/oauth-url";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const redirectUri = instagramOAuthRedirectBase(request);
  const baseUrl = redirectUri.replace(/\/api\/admin\/instagram\/oauth\/callback$/, "");

  return NextResponse.json({
    redirectUri,
    scopes: instagramOAuthScopes().split(","),
    webhookHint: `${baseUrl}/api/webhooks/meta/{your-app-slug}`,
    envHints: {
      instagramOAuthRedirectBase: "INSTAGRAM_OAUTH_REDIRECT_BASE — force callback origin in prod",
      instagramFacebookPageId:
        "INSTAGRAM_FACEBOOK_PAGE_ID — when multiple Pages link to IG",
      instagramPublicBaseUrl:
        "INSTAGRAM_PUBLIC_BASE_URL — tracked short links + smoke tests",
    },
  });
}