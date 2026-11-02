import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { runOutreachCampaign } from "@/lib/growth/outreach-run";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { limit?: number; send?: boolean; leadSource?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    /* empty body ok */
  }

  try {
    const result = await runOutreachCampaign({
      limit: body.limit ?? 200,
      send: body.send !== false,
      leadSource: body.leadSource ?? null,
      createdBy: session.email ?? "admin",
      writeExportFiles: false,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Outreach run failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
