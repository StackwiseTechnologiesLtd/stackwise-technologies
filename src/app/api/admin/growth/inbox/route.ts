import { NextResponse } from "next/server";
import { authorizeGrowthApi } from "@/lib/growth/auth";
import { listInbox } from "@/lib/growth/repository";
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
    const platformParam = searchParams.get("platform");
    const platform =
      platformParam && growthPlatforms.includes(platformParam as GrowthPlatform)
        ? (platformParam as GrowthPlatform)
        : null;
    const freshnessParam = searchParams.get("freshnessHours");
    const freshnessParsed = Number.parseInt(freshnessParam ?? "", 10);
    const freshnessHours =
      freshnessParam === "0"
        ? null
        : Number.isFinite(freshnessParsed) && freshnessParsed > 0
          ? freshnessParsed
          : undefined;

    const inbox = await listInbox({
      minScore: Number.isFinite(minScore) ? minScore : 0,
      platform,
      freshnessHours,
    });
    return NextResponse.json(inbox);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load inbox";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
