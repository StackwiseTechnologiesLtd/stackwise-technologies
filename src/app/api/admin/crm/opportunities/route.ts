import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { crmAutoPipelineMinScore } from "@/lib/crm/auto-sync";
import {
  countOpportunitiesBelowFitThreshold,
  listOpportunities,
} from "@/lib/crm/repository";
import { parseCrmSavedView, crmSavedViews } from "@/lib/crm/saved-views";
import { parseLeadSource } from "@/lib/growth/types";
import { pipelineStatuses, type PipelineStatus } from "@/lib/growth/types";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const stageParam = searchParams.get("stage");
  const stage =
    stageParam && pipelineStatuses.includes(stageParam as PipelineStatus)
      ? (stageParam as PipelineStatus)
      : null;

  const view = parseCrmSavedView(searchParams.get("view"));
  const includeBelow =
    searchParams.get("includeBelowThreshold") === "1" ||
    searchParams.get("includeBelowThreshold") === "true" ||
    view === "x_hiring";

  const viewMeta = crmSavedViews.find((v) => v.id === view);
  const leadSourceParam = searchParams.get("leadSource");
  const leadSource = leadSourceParam
    ? parseLeadSource(leadSourceParam)
    : viewMeta?.leadSource ?? null;
  const platform = viewMeta?.platform ?? null;

  try {
    const [opportunities, belowThreshold] = await Promise.all([
      listOpportunities({
        stage,
        view,
        leadSource,
        platform,
        includeBelowFitThreshold: includeBelow,
      }),
      countOpportunitiesBelowFitThreshold(),
    ]);
    return NextResponse.json({
      opportunities,
      view,
      minFitScore: crmAutoPipelineMinScore(),
      belowThreshold,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "List failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
