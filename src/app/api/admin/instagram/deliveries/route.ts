import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { listDeliveries } from "@/lib/instagram/repository";
import type { InstagramDeliveryStatus } from "@/lib/instagram/types";
import { instagramDeliveryStatuses } from "@/lib/instagram/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
    const deliveries = await listDeliveries({ status, campaignId, limit });
    return NextResponse.json({ deliveries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}