import { NextResponse } from "next/server";
import { authorizeGrowthApi } from "@/lib/growth/auth";
import { reportSessionHealth } from "@/lib/growth/repository";
import { growthPlatforms, sessionStatuses, type SessionStatus } from "@/lib/growth/types";

export async function POST(request: Request) {
  const auth = await authorizeGrowthApi(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      platform?: string;
      sessionStatus?: SessionStatus;
      lastError?: string | null;
      connectedAccountLabel?: string | null;
    };

    if (
      !body.platform ||
      !growthPlatforms.includes(body.platform as (typeof growthPlatforms)[number])
    ) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }
    if (
      !body.sessionStatus ||
      !sessionStatuses.includes(body.sessionStatus)
    ) {
      return NextResponse.json({ error: "Invalid sessionStatus" }, { status: 400 });
    }

    await reportSessionHealth({
      platform: body.platform as (typeof growthPlatforms)[number],
      sessionStatus: body.sessionStatus,
      lastError: body.lastError,
      connectedAccountLabel: body.connectedAccountLabel,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Health update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
