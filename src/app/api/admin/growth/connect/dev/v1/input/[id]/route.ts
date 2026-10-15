import { NextResponse } from "next/server";
import { requireGrowthConnectAdmin } from "@/lib/growth/connect-admin";
import {
  isDevConnectRuntimeEnabled,
  sendDevConnectInput,
} from "@/lib/growth/dev-connect-runtime";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireGrowthConnectAdmin();
  if (!auth.ok) return auth.response;

  if (!isDevConnectRuntimeEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    type?: string;
    x?: number;
    y?: number;
    key?: string;
  };

  try {
    await sendDevConnectInput(id, {
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
