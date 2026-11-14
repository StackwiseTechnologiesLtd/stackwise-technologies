import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { debugInstagramToken } from "@/lib/instagram/meta-oauth";
import {
  getAccountAccessToken,
  getMetaAppById,
  listAccounts,
} from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const account = (await listAccounts()).find((a) => a.id === id);
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const token = await getAccountAccessToken(id);
  if (!token) {
    return NextResponse.json(
      { ok: false, detail: "No token on account" },
      { status: 404 },
    );
  }

  const metaApp = await getMetaAppById(account.metaAppId);
  const result = await debugInstagramToken(
    token,
    metaApp
      ? { metaAppId: metaApp.metaAppId, appSecret: metaApp.appSecret }
      : undefined,
  );
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}