import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { mintGrowthConnectToken } from "@/lib/growth/connect-token";
import { growthPlatforms, type GrowthPlatform } from "@/lib/growth/types";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { platform?: GrowthPlatform };
    if (!body.platform || !growthPlatforms.includes(body.platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    const { token, expiresAt } = await mintGrowthConnectToken(body.platform);
    const viewerBaseUrl =
      process.env.GROWTH_CONNECT_VIEWER_BASE ?? "http://127.0.0.1:9234";

    return NextResponse.json({
      token,
      expiresAt,
      viewerBaseUrl,
      platform: body.platform,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Handshake failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
