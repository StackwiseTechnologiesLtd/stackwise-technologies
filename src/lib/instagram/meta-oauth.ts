import { getInstagramGraphVersion } from "@/lib/instagram/graph-version";

const INSTAGRAM_AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
const INSTAGRAM_TOKEN_URL = "https://api.instagram.com/oauth/access_token";

type GraphError = { message?: string; error_message?: string };

function instagramGraphBase(): string {
  return `https://graph.instagram.com/${getInstagramGraphVersion()}`;
}

function facebookGraphBase(): string {
  return `https://graph.facebook.com/${getInstagramGraphVersion()}`;
}

async function parseGraphError(
  res: Response,
  json: Record<string, unknown>,
): Promise<string> {
  const err = json.error as GraphError | undefined;
  return (
    err?.message ??
    err?.error_message ??
    String(json.error_message ?? `${res.status} ${res.statusText}`)
  );
}

export const INSTAGRAM_BUSINESS_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
] as const;

export function buildInstagramBusinessAuthorizeUrl(input: {
  instagramAppId: string;
  redirectUri: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: input.instagramAppId,
    redirect_uri: input.redirectUri,
    scope: INSTAGRAM_BUSINESS_SCOPES.join(","),
    response_type: "code",
    state: input.state,
  });
  return `${INSTAGRAM_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeInstagramCodeForToken(input: {
  instagramAppId: string;
  appSecret: string;
  code: string;
  redirectUri: string;
}): Promise<{ accessToken: string; userId: string }> {
  const body = new URLSearchParams({
    client_id: input.instagramAppId,
    client_secret: input.appSecret,
    grant_type: "authorization_code",
    redirect_uri: input.redirectUri,
    code: input.code,
  });

  const res = await fetch(INSTAGRAM_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(await parseGraphError(res, json));
  }

  const accessToken = String(json.access_token ?? "");
  const userId = String(json.user_id ?? "");
  if (!accessToken || !userId) {
    throw new Error("No access_token or user_id in token response");
  }
  return { accessToken, userId };
}

export async function exchangeInstagramLongLivedToken(input: {
  shortLivedToken: string;
  appSecret: string;
}): Promise<{ accessToken: string; expiresIn: number }> {
  const url = new URL(`${instagramGraphBase()}/access_token`);
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", input.appSecret);
  url.searchParams.set("access_token", input.shortLivedToken);

  const res = await fetch(url.toString());
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(await parseGraphError(res, json));
  }

  const accessToken = String(json.access_token ?? "");
  if (!accessToken) throw new Error("Long-lived token exchange failed");
  const expiresIn =
    typeof json.expires_in === "number" ? json.expires_in : 5_184_000;
  return { accessToken, expiresIn };
}

export type InstagramProfessionalUser = {
  id: string;
  userId: string;
  username: string | null;
  name: string | null;
};

export async function getInstagramProfessionalUser(
  accessToken: string,
): Promise<InstagramProfessionalUser> {
  const url = new URL(`${instagramGraphBase()}/me`);
  url.searchParams.set(
    "fields",
    "id,user_id,username,name",
  );
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString());
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(await parseGraphError(res, json));
  }

  const userId = String(json.user_id ?? json.id ?? "");
  if (!userId) throw new Error("Could not read Instagram user_id from /me");

  return {
    id: String(json.id ?? userId),
    userId,
    username: json.username ? String(json.username) : null,
    name: json.name ? String(json.name) : null,
  };
}

export async function subscribeInstagramAccountToWebhooks(input: {
  instagramUserId: string;
  accessToken: string;
}): Promise<{ success: boolean }> {
  const res = await fetch(
    `${instagramGraphBase()}/${encodeURIComponent(input.instagramUserId)}/subscribed_apps`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.accessToken}`,
      },
      body: JSON.stringify({
        subscribed_fields: ["comments", "messages"],
      }),
    },
  );

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error(await parseGraphError(res, json));
  }

  const json = (await res.json()) as { success?: boolean };
  return { success: Boolean(json.success ?? true) };
}

export async function debugInstagramToken(
  accessToken: string,
  metaApp?: { metaAppId: string; appSecret: string },
): Promise<{
  ok: boolean;
  detail: string;
}> {
  const appId =
    metaApp?.metaAppId ?? process.env.INSTAGRAM_DEBUG_APP_ID?.trim() ?? "";
  const appSecret =
    metaApp?.appSecret ?? process.env.INSTAGRAM_DEBUG_APP_SECRET?.trim() ?? "";
  if (!appId || !appSecret) {
    return { ok: true, detail: "Token stored (app credentials unavailable for debug)" };
  }

  const url = new URL(`${facebookGraphBase()}/debug_token`);
  url.searchParams.set("input_token", accessToken);
  url.searchParams.set("access_token", `${appId}|${appSecret}`);

  const res = await fetch(url.toString());
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const data = json.data as Record<string, unknown> | undefined;
  if (!res.ok || !data?.is_valid) {
    const err = json.error as GraphError | undefined;
    return { ok: false, detail: err?.message ?? "Token invalid" };
  }

  const scopes = Array.isArray(data.scopes) ? data.scopes.join(", ") : "";
  const expiresAt =
    typeof data.expires_at === "number" && data.expires_at > 0
      ? new Date(data.expires_at * 1000).toISOString()
      : "non-expiring";
  return { ok: true, detail: `Valid · scopes: ${scopes || "—"} · expires: ${expiresAt}` };
}

/** Meta may append `#_` to the authorization code — strip before exchange. */
export function normalizeInstagramOAuthCode(raw: string | null): string | null {
  if (!raw) return null;
  return raw.replace(/#_$/g, "").trim() || null;
}