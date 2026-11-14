import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { listAccounts, upsertAccount } from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const accounts = await listAccounts();
    return NextResponse.json({ accounts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const metaAppId = String(body.metaAppId ?? "").trim();
    const igUserId = String(body.igUserId ?? "").trim();
    const username = body.username ? String(body.username).trim() : null;
    const accessToken = body.accessToken
      ? String(body.accessToken).trim()
      : undefined;

    if (!metaAppId || !igUserId) {
      return NextResponse.json({ error: "metaAppId and igUserId required" }, { status: 400 });
    }

    const account = await upsertAccount({
      metaAppId,
      igUserId,
      username,
      accessToken,
    });
    return NextResponse.json({ account });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}