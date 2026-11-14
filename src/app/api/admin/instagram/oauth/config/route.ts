import { NextResponse } from "next/server";
import {
  isInstagramApiError,
  requireInstagramApiAccess,
} from "@/lib/instagram/api-auth";
import { instagramMetaRegistrationUrls } from "@/lib/instagram/public-endpoints";
import {
  instagramAdminReturnOrigin,
  instagramOAuthScopes,
  instagramOAuthUsesTunnel,
} from "@/lib/instagram/oauth-url";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await requireInstagramApiAccess({ manageMeta: true });
  if (isInstagramApiError(ctx)) return ctx;

  const urls = instagramMetaRegistrationUrls(request);
  const redirectUri = urls.oauthRedirectUri;
  const publicOrigin = urls.publicOrigin;
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
      metaGraphApiVersion: "META_GRAPH_API_VERSION — Graph host version (v21.0 default)",
      instagramPublicBaseUrl:
        "INSTAGRAM_PUBLIC_BASE_URL — tracked short links + smoke tests",
    },
  });
}