import { NextResponse } from "next/server";
import {
  isInstagramApiError,
  requireInstagramApiAccess,
} from "@/lib/instagram/api-auth";
import { getInstagramOpsStatus } from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireInstagramApiAccess();
  if (isInstagramApiError(ctx)) return ctx;
  try {
    const status = await getInstagramOpsStatus();
    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Status failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}