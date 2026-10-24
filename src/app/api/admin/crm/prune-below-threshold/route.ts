import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { crmAutoPipelineMinScore } from "@/lib/crm/auto-sync";
import {
  countOpportunitiesBelowFitThreshold,
  pruneOpportunitiesBelowFitThreshold,
} from "@/lib/crm/repository";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const belowThreshold = await countOpportunitiesBelowFitThreshold();
    return NextResponse.json({
      belowThreshold,
      minFitScore: crmAutoPipelineMinScore(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Count failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pruneOpportunitiesBelowFitThreshold();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Prune failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
