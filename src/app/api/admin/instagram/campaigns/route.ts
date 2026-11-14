import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { createCampaign, listCampaigns } from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const accountId = url.searchParams.get("accountId") ?? undefined;
  try {
    const campaigns = await listCampaigns(accountId);
    return NextResponse.json({ campaigns });
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
    const accountId = String(body.accountId ?? "").trim();
    const name = String(body.name ?? "").trim();
    const mediaId = String(body.mediaId ?? "").trim();
    const keyword = String(body.keyword ?? "").trim();
    const privateReplyTemplate = String(body.privateReplyTemplate ?? "").trim();
    const publicReplyTemplate = body.publicReplyTemplate
      ? String(body.publicReplyTemplate)
      : null;

    if (!accountId || !name || !mediaId || !keyword || !privateReplyTemplate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const campaign = await createCampaign({
      accountId,
      name,
      mediaId,
      keyword,
      privateReplyTemplate,
      publicReplyTemplate,
      active: body.active !== false,
    });
    return NextResponse.json({ campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}