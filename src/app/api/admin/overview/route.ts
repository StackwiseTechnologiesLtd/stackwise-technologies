import { NextResponse } from "next/server";
import { getAgencyOverview } from "@/lib/admin/agency-overview";
import { getAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const overview = await getAgencyOverview();
    return NextResponse.json({ ...overview, email: session.email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Overview failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}