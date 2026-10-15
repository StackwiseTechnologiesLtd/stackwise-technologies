import { NextResponse } from "next/server";
import { requireGrowthConnectAdmin } from "@/lib/growth/connect-admin";
import { verifyGrowthConnectToken } from "@/lib/growth/connect-token";
import {
  isDevConnectRuntimeEnabled,
  startDevConnectSession,
} from "@/lib/growth/dev-connect-runtime";

export async function POST(request: Request) {
  const auth = await requireGrowthConnectAdmin();
  if (!auth.ok) return auth.response;

  if (!isDevConnectRuntimeEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

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

    const { sessionId, interaction } = await startDevConnectSession(platform);

    return NextResponse.json({
      sessionId,
      interaction,
      embedUrl: `/api/admin/growth/connect/dev/v1/embed?session=${sessionId}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Session failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
