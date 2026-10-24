import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { crmAutoPipelineMinScore } from "@/lib/crm/auto-sync";
import {
  countOpportunitiesBelowFitThreshold,
  listOpportunities,
} from "@/lib/crm/repository";
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

  const includeBelow =
    searchParams.get("includeBelowThreshold") === "1" ||
    searchParams.get("includeBelowThreshold") === "true";

  try {
    const [opportunities, belowThreshold] = await Promise.all([
      listOpportunities({ stage, includeBelowFitThreshold: includeBelow }),
      countOpportunitiesBelowFitThreshold(),
    ]);
    return NextResponse.json({
      opportunities,
      minFitScore: crmAutoPipelineMinScore(),
      belowThreshold,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "List failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
