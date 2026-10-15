import { NextResponse } from "next/server";
import { authorizeGrowthApi } from "@/lib/growth/auth";
import { listLeads } from "@/lib/growth/repository";
import { growthPlatforms, type GrowthPlatform } from "@/lib/growth/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authorizeGrowthApi(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const minScore = Number.parseInt(searchParams.get("minScore") ?? "", 10);
    const maxScore = Number.parseInt(searchParams.get("maxScore") ?? "", 10);
    const platformParam = searchParams.get("platform");
    const platform =
      platformParam && growthPlatforms.includes(platformParam as GrowthPlatform)
        ? (platformParam as GrowthPlatform)
        : null;
    const leads = await listLeads({
      minScore: Number.isFinite(minScore) ? minScore : 0,
      maxScore: Number.isFinite(maxScore) ? maxScore : 100,
      platform,
    });
    return NextResponse.json({ leads });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list leads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
