import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import {
  instagramAdminReturnOrigin,
  instagramOAuthRedirectBase,
  instagramOAuthScopes,
  instagramOAuthUsesTunnel,
  instagramPublicOrigin,
} from "@/lib/instagram/oauth-url";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const redirectUri = instagramOAuthRedirectBase(request);
  const publicOrigin = instagramPublicOrigin(request);
  const adminReturnOrigin = instagramAdminReturnOrigin(request);
  const usesTunnel = instagramOAuthUsesTunnel();

  return NextResponse.json({
    redirectUri,
    publicOrigin,
    adminReturnOrigin,
    usesTunnel,
    scopes: instagramOAuthScopes().split(","),
    webhookHint: `${publicOrigin}/api/webhooks/meta/{your-app-slug}`,
    ngrok: usesTunnel
      ? {
          callbackRegisterInMeta: redirectUri,
          tunnelEnv: "INSTAGRAM_OAUTH_REDIRECT_BASE",
          adminAfterConnect: adminReturnOrigin,
        }
      : null,
    envHints: {
      instagramOAuthRedirectBase:
        "INSTAGRAM_OAUTH_REDIRECT_BASE — ngrok or prod origin (no path), e.g. https://abc.ngrok-free.app",
      instagramOAuthAdminReturnBase:
        "INSTAGRAM_OAUTH_ADMIN_RETURN_BASE — optional; defaults to NEXT_PUBLIC_SITE_URL when tunnel is set",
      instagramFacebookPageId:
        "INSTAGRAM_FACEBOOK_PAGE_ID — when multiple Pages link to IG",
      instagramPublicBaseUrl:
        "INSTAGRAM_PUBLIC_BASE_URL — tracked short links + smoke tests",
    },
  });
}