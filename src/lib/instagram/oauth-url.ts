import { INSTAGRAM_BUSINESS_SCOPES } from "@/lib/instagram/meta-oauth";

/** Build Instagram Business Login URL (official API; OpenReply-class flow). */
export function buildMetaInstagramOAuthUrl(input: {
  metaAppId: string;
  redirectUri: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: input.metaAppId,
    redirect_uri: input.redirectUri,
    scope: INSTAGRAM_BUSINESS_SCOPES.join(","),
    response_type: "code",
    state: input.state,
  });
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

/** Public HTTPS/origin Meta and webhooks must reach (ngrok, prod domain, or local). */
export function instagramPublicOrigin(request?: Request): string {
  const tunnel = process.env.INSTAGRAM_OAUTH_REDIRECT_BASE?.trim();
  if (tunnel) return tunnel.replace(/\/$/, "");
  if (request) return new URL(request.url).origin;
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return base.replace(/\/$/, "");
}

export function instagramOAuthRedirectBase(request?: Request): string {
  return `${instagramPublicOrigin(request)}/api/admin/instagram/oauth/callback`;
}

/**
 * Where to send the browser after OAuth (admin UI).
 * With ngrok callback + local dev: set tunnel in INSTAGRAM_OAUTH_REDIRECT_BASE and
 * NEXT_PUBLIC_SITE_URL=http://localhost:PORT (or INSTAGRAM_OAUTH_ADMIN_RETURN_BASE).
 */
export function instagramAdminReturnOrigin(request?: Request): string {
  const explicit = process.env.INSTAGRAM_OAUTH_ADMIN_RETURN_BASE?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const tunnel = process.env.INSTAGRAM_OAUTH_REDIRECT_BASE?.trim();
  if (tunnel) {
    const local = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (local) return local.replace(/\/$/, "");
    return tunnel.replace(/\/$/, "");
  }

  if (request) return new URL(request.url).origin;
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return base.replace(/\/$/, "");
}

export function instagramOAuthScopes(): string {
  return INSTAGRAM_BUSINESS_SCOPES.join(",");
}

export function instagramOAuthUsesTunnel(): boolean {
  return Boolean(process.env.INSTAGRAM_OAUTH_REDIRECT_BASE?.trim());
}