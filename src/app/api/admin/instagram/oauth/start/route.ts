import { NextResponse } from "next/server";
import {
  isInstagramApiError,
  requireInstagramApiAccess,
} from "@/lib/instagram/api-auth";
import { buildMetaInstagramOAuthUrl, instagramOAuthRedirectBase } from "@/lib/instagram/oauth-url";
import { mintInstagramOAuthState } from "@/lib/instagram/oauth-state";
import { getMetaAppById } from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await requireInstagramApiAccess({ manageMeta: true });
  if (isInstagramApiError(ctx)) return ctx;

  const url = new URL(request.url);
  const metaAppRowId = url.searchParams.get("metaAppId");
  if (!metaAppRowId) {
    return NextResponse.json({ error: "metaAppId required" }, { status: 400 });
  }

  const app = await getMetaAppById(metaAppRowId);
  if (!app) {
    return NextResponse.json({ error: "Unknown app" }, { status: 404 });
  }

  const state = await mintInstagramOAuthState({
    metaAppRowId,
    email: ctx.session.email,
  });

  const redirectUri = instagramOAuthRedirectBase(request);
  const oauthUrl = buildMetaInstagramOAuthUrl({
    metaAppId: app.metaAppId,
    redirectUri,
    state,
  });

  return NextResponse.redirect(oauthUrl);
}