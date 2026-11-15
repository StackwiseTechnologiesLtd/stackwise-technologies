import { NextResponse } from "next/server";
import {
  filterByAccountAccess,
  filterCampaignsByAccountAccess,
} from "@/lib/instagram/access";
import {
  isInstagramApiError,
  requireInstagramApiAccess,
} from "@/lib/instagram/api-auth";
import {
  getInstagramCampaignInsights,
  getInstagramDeliveryMetrics,
  getInstagramOpsStatus,
  getInstagramSendTrend,
  listAccounts,
  listCampaigns,
  listDeliveries,
} from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireInstagramApiAccess();
  if (isInstagramApiError(ctx)) return ctx;
  try {
    const [status, metrics, campaigns, accounts, recent, campaignInsights, sendTrend] =
      await Promise.all([
        getInstagramOpsStatus({ accountIds: ctx.access.accountIds }),
        getInstagramDeliveryMetrics({ accountIds: ctx.access.accountIds }),
        listCampaigns(),
        listAccounts(),
        listDeliveries({
          limit: 15,
          offset: 0,
          accountIds: ctx.access.accountIds,
        }),
        getInstagramCampaignInsights({ accountIds: ctx.access.accountIds }),
        getInstagramSendTrend({ accountIds: ctx.access.accountIds, days: 7 }),
      ]);
    return NextResponse.json({
      status,
      metrics,
      campaigns: filterCampaignsByAccountAccess(campaigns, ctx.access),
      accounts: filterByAccountAccess(accounts, ctx.access),
      recentDeliveries: recent.deliveries,
      campaignInsights,
      sendTrend,
      access: {
        kind: ctx.access.kind,
        canManageMetaApps: ctx.access.canManageMetaApps,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}