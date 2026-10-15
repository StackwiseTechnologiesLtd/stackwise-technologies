import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { getIcpConfig, saveIcpConfig } from "@/lib/growth/repository";
import type { IcpConfig } from "@/lib/growth/types";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const config = await getIcpConfig();
    return NextResponse.json({ config });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load ICP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as { config?: IcpConfig };
    if (!body.config) {
      return NextResponse.json({ error: "config is required" }, { status: 400 });
    }
    await saveIcpConfig(body.config);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
