import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { createCampaign, listCampaigns } from "@/lib/instagram/repository";
import {
  instagramCampaignTriggers,
  type InstagramCampaignTrigger,
} from "@/lib/instagram/types";

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
    const mediaIdRaw = body.mediaId ? String(body.mediaId).trim() : "";
    const triggerRaw = String(body.triggerType ?? "comment").trim();
    const triggerType = instagramCampaignTriggers.includes(
      triggerRaw as InstagramCampaignTrigger,
    )
      ? (triggerRaw as InstagramCampaignTrigger)
      : "comment";
    const keyword = String(body.keyword ?? "").trim();
    const privateReplyTemplate = String(body.privateReplyTemplate ?? "").trim();
    const publicReplyTemplate = body.publicReplyTemplate
      ? String(body.publicReplyTemplate)
      : null;

    if (!accountId || !name || !keyword || !privateReplyTemplate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (triggerType === "comment" && !mediaIdRaw) {
      return NextResponse.json({ error: "mediaId required for comment campaigns" }, { status: 400 });
    }

    const campaign = await createCampaign({
      accountId,
      name,
      mediaId: mediaIdRaw || null,
      keyword,
      triggerType,
      privateReplyTemplate,
      publicReplyTemplate,
      buttonLabel1: body.buttonLabel1 ? String(body.buttonLabel1) : null,
      buttonUrl1: body.buttonUrl1 ? String(body.buttonUrl1) : null,
      buttonLabel2: body.buttonLabel2 ? String(body.buttonLabel2) : null,
      buttonUrl2: body.buttonUrl2 ? String(body.buttonUrl2) : null,
      active: body.active !== false,
    });
    return NextResponse.json({ campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}