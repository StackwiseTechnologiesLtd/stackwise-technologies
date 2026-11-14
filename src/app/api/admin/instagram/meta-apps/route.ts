import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { createMetaApp, listMetaApps } from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const apps = await listMetaApps();
    return NextResponse.json({ apps });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const label = String(body.label ?? "").trim();
    const metaAppId = String(body.metaAppId ?? "").trim();
    const appSecret = String(body.appSecret ?? "").trim();
    const webhookVerifyToken = String(body.webhookVerifyToken ?? "").trim();
    const slug = body.slug ? String(body.slug).trim() : undefined;
    const facebookAppSecret = body.facebookAppSecret
      ? String(body.facebookAppSecret).trim()
      : undefined;

    if (!label || !metaAppId || !appSecret || !webhookVerifyToken) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const app = await createMetaApp({
      label,
      metaAppId,
      appSecret,
      facebookAppSecret,
      webhookVerifyToken,
      slug,
    });
    return NextResponse.json({ app });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}