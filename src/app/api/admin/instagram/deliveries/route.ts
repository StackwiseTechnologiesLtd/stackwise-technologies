import { NextResponse } from "next/server";
import {
  isInstagramApiError,
  requireInstagramApiAccess,
} from "@/lib/instagram/api-auth";
import { listDeliveries } from "@/lib/instagram/repository";
import type { InstagramDeliveryStatus } from "@/lib/instagram/types";
import { instagramDeliveryStatuses } from "@/lib/instagram/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await requireInstagramApiAccess();
  if (isInstagramApiError(ctx)) return ctx;
  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const campaignId = url.searchParams.get("campaignId") ?? undefined;
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") ?? url.searchParams.get("pageSize") ?? "25")),
  );
  const offset = (page - 1) * pageSize;

  const status =
    statusParam &&
    instagramDeliveryStatuses.includes(statusParam as InstagramDeliveryStatus)
      ? (statusParam as InstagramDeliveryStatus)
      : undefined;

  try {
    const { deliveries, total } = await listDeliveries({
      status,
      campaignId,
      limit: pageSize,
      offset,
      accountIds: ctx.access.accountIds,
    });
    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);
    return NextResponse.json({
      deliveries,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}