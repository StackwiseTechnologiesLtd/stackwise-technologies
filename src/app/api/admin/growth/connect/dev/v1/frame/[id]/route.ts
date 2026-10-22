import { NextResponse } from "next/server";
import { requireGrowthConnectAdmin } from "@/lib/growth/connect-admin";
import { isDevConnectRuntimeEnabled } from "@/lib/growth/dev-connect-flags";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireGrowthConnectAdmin();
  if (!auth.ok) return auth.response;

  if (process.env.NODE_ENV !== "development" || !isDevConnectRuntimeEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  const { getDevConnectFrame } = await import("@/lib/growth/dev-connect-runtime");
  const { id } = await context.params;
  const frame = await getDevConnectFrame(id);
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
