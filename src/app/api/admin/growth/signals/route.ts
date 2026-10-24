import { NextResponse } from "next/server";
import { authorizeGrowthApi } from "@/lib/growth/auth";
import { ingestSignal } from "@/lib/growth/repository";
import { growthPlatforms, type IngestSignalInput } from "@/lib/growth/types";

export async function POST(request: Request) {
  const auth = await authorizeGrowthApi(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as IngestSignalInput;
    if (!body.platform || !growthPlatforms.includes(body.platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }
    if (!body.authorName?.trim() || !body.bodyText?.trim()) {
      return NextResponse.json(
        { error: "authorName and bodyText are required" },
        { status: 400 },
      );
    }

    const result = await ingestSignal({
      ...body,
      leadSource: body.leadSource ?? "manual",
      authorName: body.authorName.trim(),
      bodyText: body.bodyText.trim(),
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingest failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
