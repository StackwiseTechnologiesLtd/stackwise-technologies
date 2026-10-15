import { NextResponse } from "next/server";
import { requireGrowthConnectAdmin } from "@/lib/growth/connect-admin";
import { getHostedWorkerBrowser } from "@/lib/growth/hosted-connect";

export async function GET() {
  const auth = await requireGrowthConnectAdmin();
  if (!auth.ok) return auth.response;

  const worker = await getHostedWorkerBrowser();
  if (!worker) {
    return NextResponse.json(
      { ok: false, error: "Browser binding unavailable" },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
