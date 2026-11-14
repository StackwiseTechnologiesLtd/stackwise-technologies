import { NextResponse } from "next/server";
import { filterCampaignsByAccountAccess } from "@/lib/instagram/access";
import {
  isInstagramApiError,
  requireInstagramApiAccess,
} from "@/lib/instagram/api-auth";
import { listCampaigns, listDeliveries } from "@/lib/instagram/repository";
import type { InstagramDeliveryStatus } from "@/lib/instagram/types";
import { instagramDeliveryStatuses } from "@/lib/instagram/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await requireInstagramApiAccess();
  if (isInstagramApiError(ctx)) return ctx;
  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const campaignId = url.searchParams.get("campaignId") ?? undefined;
  const limit = Number(url.searchParams.get("limit") ?? "50");

  const status =
    statusParam &&
    instagramDeliveryStatuses.includes(statusParam as InstagramDeliveryStatus)
      ? (statusParam as InstagramDeliveryStatus)
      : undefined;

  try {
    let deliveries = await listDeliveries({ status, campaignId, limit });
    if (ctx.access.accountIds) {
      const allowedCampaigns = filterCampaignsByAccountAccess(
        await listCampaigns(),
        ctx.access,
      );
      const allowedIds = new Set(allowedCampaigns.map((c) => c.id));
      deliveries = deliveries.filter(
        (d) => d.accountId && ctx.access.accountIds!.includes(d.accountId),
      );
      if (campaignId && !allowedIds.has(campaignId)) {
        deliveries = [];
      }
    }
    return NextResponse.json({ deliveries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}