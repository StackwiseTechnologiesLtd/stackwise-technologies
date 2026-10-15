import { NextResponse } from "next/server";
import { requireGrowthConnectAdmin } from "@/lib/growth/connect-admin";
import {
  captureHostedConnectFrame,
  getHostedWorkerBrowser,
} from "@/lib/growth/hosted-connect";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireGrowthConnectAdmin();
  if (!auth.ok) return auth.response;

  const worker = await getHostedWorkerBrowser();
  if (!worker) {
    return new NextResponse(null, { status: 503 });
  }

  const { id } = await context.params;
  const frame = await captureHostedConnectFrame(worker.env, id);
  if (!frame) {
    return new NextResponse(null, { status: 204 });
  }

  return new Response(frame.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-store",
    },
  });
}
