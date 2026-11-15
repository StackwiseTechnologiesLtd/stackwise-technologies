import { NextResponse } from "next/server";
import { isInstagramApiError, requireInstagramApiAccess } from "@/lib/instagram/api-auth";
import {
  getInstagramCampaignInsights,
  getInstagramSendTrend,
} from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireInstagramApiAccess();
  if (isInstagramApiError(ctx)) return ctx;
  try {
    const [insights, sendTrend] = await Promise.all([
      getInstagramCampaignInsights({ accountIds: ctx.access.accountIds }),
      getInstagramSendTrend({ accountIds: ctx.access.accountIds, days: 7 }),
    ]);
    return NextResponse.json({ insights, sendTrend });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}