import { NextResponse } from "next/server";
import { authorizeGrowthApi } from "@/lib/growth/auth";
import { ingestSignal } from "@/lib/growth/repository";
import { growthPlatforms, type IngestSignalInput } from "@/lib/growth/types";

/** Batch ingest for a local connector using GROWTH_CONNECTOR_SECRET or admin session. */
export async function POST(request: Request) {
  const auth = await authorizeGrowthApi(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { signals?: IngestSignalInput[] };
    if (!body.signals?.length) {
      return NextResponse.json({ error: "signals array required" }, { status: 400 });
    }

    const results = [];
    for (const signal of body.signals) {
      if (!signal.platform || !growthPlatforms.includes(signal.platform)) {
        continue;
      }
      if (!signal.authorName?.trim() || !signal.bodyText?.trim()) {
        continue;
      }
      results.push(
        await ingestSignal({
          ...signal,
          authorName: signal.authorName.trim(),
          bodyText: signal.bodyText.trim(),
        }),
      );
    }

    return NextResponse.json({ ingested: results.length, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Batch ingest failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
