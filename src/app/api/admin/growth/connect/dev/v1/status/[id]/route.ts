import { NextResponse } from "next/server";
import { requireGrowthConnectAdmin } from "@/lib/growth/connect-admin";
import {
  getDevConnectStatus,
  isDevConnectRuntimeEnabled,
} from "@/lib/growth/dev-connect-runtime";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireGrowthConnectAdmin();
  if (!auth.ok) return auth.response;

  if (!isDevConnectRuntimeEnabled()) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { id } = await context.params;
  const session = getDevConnectStatus(id);
  if (!session) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(session);
}
