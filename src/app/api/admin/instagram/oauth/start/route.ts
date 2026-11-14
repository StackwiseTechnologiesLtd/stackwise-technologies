import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { buildMetaInstagramOAuthUrl, instagramOAuthRedirectBase } from "@/lib/instagram/oauth-url";
import { mintInstagramOAuthState } from "@/lib/instagram/oauth-state";
import { listMetaApps } from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const metaAppRowId = url.searchParams.get("metaAppId");
  if (!metaAppRowId) {
    return NextResponse.json({ error: "metaAppId required" }, { status: 400 });
  }

  const apps = await listMetaApps();
  const app = apps.find((a) => a.id === metaAppRowId);
  if (!app) {
    return NextResponse.json({ error: "Unknown app" }, { status: 404 });
  }

  const state = await mintInstagramOAuthState({
    metaAppRowId,
    email: session.email,
  });

  const oauthUrl = buildMetaInstagramOAuthUrl({
    metaAppId: app.metaAppId,
    redirectUri: instagramOAuthRedirectBase(),
    state,
  });

  return NextResponse.redirect(oauthUrl);
}