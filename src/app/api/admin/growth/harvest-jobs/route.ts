import { NextResponse } from "next/server";
import { authorizeGrowthApi } from "@/lib/growth/auth";
import {
  encodeHarvestEvent,
  progressLine,
  type HarvestProgressEvent,
} from "@/lib/growth/harvest-progress";
import { runLinkedInJobsHarvest } from "@/lib/growth/run-linkedin-jobs-harvest";

function wantsStream(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("application/x-ndjson")) return true;
  const url = new URL(request.url);
  return url.searchParams.get("stream") === "1";
}

export async function POST(request: Request) {
  const auth = await authorizeGrowthApi(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (wantsStream(request)) {
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: HarvestProgressEvent) => {
          controller.enqueue(encodeHarvestEvent(event));
        };

        try {
          const result = await runLinkedInJobsHarvest((phase, message) => {
            emit(progressLine(phase, message));
          });
          emit({
            type: "complete",
            platform: "linkedin",
            captured: result.captured,
            ingested: result.ingested,
            at: new Date().toISOString(),
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Jobs harvest failed";
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
    const result = await runLinkedInJobsHarvest();
    return NextResponse.json({
      ok: true,
      platform: "linkedin",
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Jobs harvest failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
