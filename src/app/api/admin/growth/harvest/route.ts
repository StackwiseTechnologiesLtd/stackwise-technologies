import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import {
  encodeHarvestEvent,
  progressLine,
  type HarvestProgressEvent,
} from "@/lib/growth/harvest-progress";
import { runPlatformHarvest } from "@/lib/growth/run-harvest";
import { growthPlatforms, type GrowthPlatform } from "@/lib/growth/types";

function wantsStream(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("application/x-ndjson")) return true;
  const url = new URL(request.url);
  return url.searchParams.get("stream") === "1";
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let platform: GrowthPlatform | undefined;
  try {
    const body = (await request.json()) as { platform?: GrowthPlatform };
    platform = body.platform;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!platform || !growthPlatforms.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  if (wantsStream(request)) {
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: HarvestProgressEvent) => {
          controller.enqueue(encodeHarvestEvent(event));
        };

        try {
          const result = await runPlatformHarvest(platform!, (phase, message) => {
            emit(progressLine(phase, message));
          });
          emit({
            type: "complete",
            platform: platform!,
            captured: result.captured,
            ingested: result.ingested,
            at: new Date().toISOString(),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Harvest failed";
          emit({
            type: "error",
            message,
            at: new Date().toISOString(),
          });
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  try {
    const result = await runPlatformHarvest(platform);
    return NextResponse.json({
      ok: true,
      platform,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Harvest failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
