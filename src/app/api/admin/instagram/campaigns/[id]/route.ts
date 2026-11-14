import { NextResponse } from "next/server";
import { filterCampaignsByAccountAccess } from "@/lib/instagram/access";
import {
  isInstagramApiError,
  requireAccountScope,
  requireInstagramApiAccess,
} from "@/lib/instagram/api-auth";
import { listCampaigns, patchCampaign } from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const ctx = await requireInstagramApiAccess();
  if (isInstagramApiError(ctx)) return ctx;
  const { id } = await context.params;
  try {
    const found = filterCampaignsByAccountAccess(await listCampaigns(), ctx.access).find(
      (c) => c.id === id,
    );
    if (!found) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const scopeErr = requireAccountScope(ctx.access, found.accountId);
    if (scopeErr) return scopeErr;
    const body = (await request.json()) as Record<string, unknown>;
    const campaign = await patchCampaign(id, {
      active: typeof body.active === "boolean" ? body.active : undefined,
    });
    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}