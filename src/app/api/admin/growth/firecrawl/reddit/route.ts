import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { discoverRedditFirecrawlBatch } from "@/lib/growth/reddit-firecrawl-discover";
import { firecrawlHealth } from "@/lib/integrations/firecrawl-client";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await firecrawlHealth())) {
    return NextResponse.json(
      {
        error:
          "Local Firecrawl is not reachable. Run: npm run integrations:firecrawl:up",
      },
      { status: 503 },
    );
  }

  let body: { limitPerQuery?: number; query?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    /* empty ok — run full batch */
  }

  try {
    const result = await discoverRedditFirecrawlBatch({
      limitPerQuery: body.limitPerQuery ?? 12,
      queries: body.query?.trim() ? [body.query.trim()] : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reddit discover failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
