import { NextResponse } from "next/server";
import { requireGrowthConnectAdmin } from "@/lib/growth/connect-admin";
import { getConnectBrowserSession } from "@/lib/growth/connect-sessions-repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireGrowthConnectAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const session = await getConnectBrowserSession(id);
  if (!session) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: session.status,
    lastError: session.lastError,
    platform: session.platform,
  });
}
