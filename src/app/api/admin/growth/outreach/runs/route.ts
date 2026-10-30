import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { listOutreachRuns } from "@/lib/growth/outreach-run";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const runs = await listOutreachRuns(20);
  return NextResponse.json({ runs });
}
