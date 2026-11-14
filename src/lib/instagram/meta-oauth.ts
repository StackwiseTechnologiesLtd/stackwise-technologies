const GRAPH_VERSION = "v21.0";

type GraphError = { message?: string };

async function parseGraphError(
  res: Response,
  json: Record<string, unknown>,
): Promise<string> {
  const err = json.error as GraphError | undefined;
  return err?.message ?? `${res.status} ${res.statusText}`;
}

export async function exchangeCodeForUserToken(input: {
  metaAppId: string;
  appSecret: string;
  code: string;
  redirectUri: string;
}): Promise<{ accessToken: string; expiresIn: number | null }> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`);
  url.searchParams.set("client_id", input.metaAppId);
  url.searchParams.set("client_secret", input.appSecret);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("code", input.code);

  const res = await fetch(url.toString());
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(await parseGraphError(res, json));
  }
  const accessToken = String(json.access_token ?? "");
  if (!accessToken) throw new Error("No access_token in OAuth response");
  const expiresIn =
    typeof json.expires_in === "number" ? json.expires_in : null;
  return { accessToken, expiresIn };
}

export async function exchangeLongLivedUserToken(input: {
  metaAppId: string;
  appSecret: string;
  shortLivedToken: string;
}): Promise<{ accessToken: string; expiresIn: number | null }> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", input.metaAppId);
  url.searchParams.set("client_secret", input.appSecret);
  url.searchParams.set("fb_exchange_token", input.shortLivedToken);

  const res = await fetch(url.toString());
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(await parseGraphError(res, json));
  }
  return {
    accessToken: String(json.access_token ?? ""),
    expiresIn: typeof json.expires_in === "number" ? json.expires_in : null,
  };
}

export type FacebookPageWithIg = {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  igUserId: string;
  igUsername: string | null;
};

export async function listFacebookPagesWithInstagram(
  userAccessToken: string,
): Promise<FacebookPageWithIg[]> {
  const pagesUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/me/accounts`);
  pagesUrl.searchParams.set("access_token", userAccessToken);
  pagesUrl.searchParams.set("fields", "id,name,access_token,instagram_business_account{id,username}");

  const res = await fetch(pagesUrl.toString());
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(await parseGraphError(res, json));
  }

  const data = Array.isArray(json.data) ? json.data : [];
  const out: FacebookPageWithIg[] = [];

  for (const row of data) {
    if (!row || typeof row !== "object") continue;
    const page = row as Record<string, unknown>;
    const pageAccessToken = String(page.access_token ?? "");
    const pageId = String(page.id ?? "");
    const pageName = String(page.name ?? pageId);
    const iba = page.instagram_business_account as
      | { id?: string; username?: string }
      | undefined;
    const igUserId = iba?.id ? String(iba.id) : "";
    if (!pageId || !pageAccessToken || !igUserId) continue;

    let igUsername = iba?.username ? String(iba.username) : null;
    if (!igUsername) {
      const profRes = await fetch(
        `https://graph.instagram.com/${GRAPH_VERSION}/${igUserId}?fields=username&access_token=${encodeURIComponent(pageAccessToken)}`,
      );
      const prof = (await profRes.json()) as { username?: string };
      igUsername = prof.username ?? null;
    }

    out.push({
      pageId,
      pageName,
      pageAccessToken,
      igUserId,
      igUsername,
    });
  }

  return out;
}

export function pickFacebookPage(
  pages: FacebookPageWithIg[],
  preferredPageId: string | null,
): FacebookPageWithIg | null {
  if (pages.length === 0) return null;
  if (preferredPageId) {
    return pages.find((p) => p.pageId === preferredPageId) ?? null;
  }
  if (pages.length === 1) return pages[0] ?? null;
  return null;
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

  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/debug_token`);
  url.searchParams.set("input_token", accessToken);
  url.searchParams.set(
    "access_token",
    `${appId}|${appSecret}`,
  );

  const res = await fetch(url.toString());
  const json = (await res.json()) as Record<string, unknown>;
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