import {
  instagramOAuthRedirectBase,
  instagramPublicOrigin,
} from "@/lib/instagram/oauth-url";

/** URLs to register in Meta (Business login + webhooks) for the current deployment. */
export function instagramMetaRegistrationUrls(request?: Request): {
  publicOrigin: string;
  oauthRedirectUri: string;
  webhookUrlForSlug: (slug: string) => string;
  webhookUrlPattern: string;
} {
  const publicOrigin = instagramPublicOrigin(request);
  const oauthRedirectUri = instagramOAuthRedirectBase(request);
  return {
    publicOrigin,
    oauthRedirectUri,
    webhookUrlPattern: `${publicOrigin}/api/webhooks/meta/{appSlug}`,
    webhookUrlForSlug: (slug: string) =>
      `${publicOrigin}/api/webhooks/meta/${encodeURIComponent(slug)}`,
  };
}