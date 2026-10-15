import { NextResponse } from "next/server";
import { authorizeGrowthApi } from "@/lib/growth/auth";
import {
  listCredentialStatus,
  savePlatformCredentials,
} from "@/lib/growth/repository";
import { growthPlatforms, type GrowthPlatform } from "@/lib/growth/types";

export async function GET(request: Request) {
  const auth = await authorizeGrowthApi(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const platforms = await listCredentialStatus();
    return NextResponse.json({ platforms });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load credentials";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await authorizeGrowthApi(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      platform?: GrowthPlatform;
      cookies?: unknown;
      userAgent?: string;
      displayLabel?: string;
    };

    if (!body.platform || !growthPlatforms.includes(body.platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }
    if (!body.cookies) {
      return NextResponse.json({ error: "cookies are required" }, { status: 400 });
    }

    await savePlatformCredentials({
      platform: body.platform,
      cookies: body.cookies,
      userAgent: body.userAgent,
      displayLabel: body.displayLabel,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
