const SCOPES = [
  "instagram_basic",
  "instagram_manage_comments",
  "instagram_manage_messages",
  "pages_show_list",
  "pages_read_engagement",
].join(",");

/** Build Facebook Login URL for Instagram Business/Creator connect (direct Meta app). */
export function buildMetaInstagramOAuthUrl(input: {
  metaAppId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", input.metaAppId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", input.state);
  return url.toString();
}

export function instagramOAuthRedirectBase(): string {
  const base =
    process.env.INSTAGRAM_OAUTH_REDIRECT_BASE?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/admin/instagram/oauth/callback`;
}