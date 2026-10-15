import { NextResponse } from "next/server";
import { requireGrowthConnectAdmin } from "@/lib/growth/connect-admin";
import { resolveGrowthConnect } from "@/lib/growth/connect-routing";

export async function GET(request: Request) {
  const auth = await requireGrowthConnectAdmin();
  if (!auth.ok) return auth.response;

  const { mode, viewerBaseUrl } = await resolveGrowthConnect(request);
  return NextResponse.json({ mode, viewerBaseUrl });
}
