import { NextResponse } from "next/server";
import { authorizeGrowthApi } from "@/lib/growth/auth";
import { verifyGrowthConnectToken } from "@/lib/growth/connect-token";

/** Used by the local connect server to authorize a browser session. */
export async function POST(request: Request) {
  const auth = await authorizeGrowthApi(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { token?: string };
    if (!body.token?.trim()) {
      return NextResponse.json({ error: "token required" }, { status: 400 });
    }

    const platform = await verifyGrowthConnectToken(body.token.trim());
    if (!platform) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    return NextResponse.json({ valid: true, platform });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Validate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
