import { NextResponse } from "next/server";
import { authorizeConnectorSecret } from "@/lib/growth/connector-auth";
import { getPlatformSession } from "@/lib/growth/repository";
import { growthPlatforms, type GrowthPlatform } from "@/lib/growth/types";

/**
 * Returns decrypted session cookies for the local connector only.
 * Requires GROWTH_CONNECTOR_SECRET (not an admin browser session).
 */
export async function GET(request: Request) {
  if (!authorizeConnectorSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platform = new URL(request.url).searchParams.get(
    "platform",
  ) as GrowthPlatform | null;
  if (!platform || !growthPlatforms.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  try {
    const session = await getPlatformSession(platform);
    if (!session) {
      return NextResponse.json({ error: "No credentials stored" }, { status: 404 });
    }
    return NextResponse.json({
      platform,
      cookies: session.cookies,
      userAgent: session.userAgent,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load credentials";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
