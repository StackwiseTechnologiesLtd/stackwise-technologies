import { NextResponse } from "next/server";
import { requireGrowthConnectAdmin } from "@/lib/growth/connect-admin";
import { verifyGrowthConnectToken } from "@/lib/growth/connect-token";
import {
  getHostedWorkerBrowser,
  startHostedConnectSession,
} from "@/lib/growth/hosted-connect";

export async function POST(request: Request) {
  const auth = await requireGrowthConnectAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as { token?: string };
    if (!body.token?.trim()) {
      return NextResponse.json({ error: "token required" }, { status: 400 });
    }

    const platform = await verifyGrowthConnectToken(body.token.trim());
    if (!platform) {
      return NextResponse.json(
        { error: "Invalid or expired connect token" },
        { status: 401 },
      );
    }

    const worker = await getHostedWorkerBrowser();
    if (!worker) {
      return NextResponse.json(
        { error: "Hosted browser not available on this deployment" },
        { status: 503 },
      );
    }

    const { sessionId } = await startHostedConnectSession(
      worker.env,
      platform,
      worker.ctx,
    );

    return NextResponse.json({
      sessionId,
      embedUrl: `/api/admin/growth/connect/browser/v1/embed?session=${sessionId}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Session failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
