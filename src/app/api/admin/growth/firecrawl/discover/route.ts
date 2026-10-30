import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { discoverFirecrawlLeads } from "@/lib/growth/firecrawl-leads";
import { firecrawlHealth } from "@/lib/integrations/firecrawl-client";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ok = await firecrawlHealth();
  return NextResponse.json({ ok, apiBase: process.env.FIRECRAWL_API_BASE ?? "http://localhost:3002" });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { query?: string; limit?: number } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON body required" }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
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

  try {
    const result = await discoverFirecrawlLeads({
      query,
      limit: body.limit ?? 10,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discover failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
