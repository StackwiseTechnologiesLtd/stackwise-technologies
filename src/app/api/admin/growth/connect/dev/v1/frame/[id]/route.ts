import { NextResponse } from "next/server";
import { requireGrowthConnectAdmin } from "@/lib/growth/connect-admin";
import {
  getDevConnectFrame,
  isDevConnectRuntimeEnabled,
} from "@/lib/growth/dev-connect-runtime";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireGrowthConnectAdmin();
  if (!auth.ok) return auth.response;

  if (!isDevConnectRuntimeEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  const { id } = await context.params;
  const frame = getDevConnectFrame(id);
  if (!frame) {
    return new NextResponse(null, { status: 204 });
  }

  return new Response(new Uint8Array(frame), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-store",
    },
  });
}
