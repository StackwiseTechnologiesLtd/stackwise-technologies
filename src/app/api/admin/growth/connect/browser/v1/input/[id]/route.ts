import { NextResponse } from "next/server";
import { requireGrowthConnectAdmin } from "@/lib/growth/connect-admin";
import {
  getHostedWorkerBrowser,
  sendHostedConnectInput,
} from "@/lib/growth/hosted-connect";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireGrowthConnectAdmin();
  if (!auth.ok) return auth.response;

  const worker = await getHostedWorkerBrowser();
  if (!worker) {
    return NextResponse.json({ error: "Browser unavailable" }, { status: 503 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    type?: string;
    x?: number;
    y?: number;
    key?: string;
  };

  try {
    await sendHostedConnectInput(worker.env, id, {
      type: body.type ?? "",
      x: body.x,
      y: body.y,
      key: body.key,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Input failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
