import { NextResponse } from "next/server";
import {
  isInstagramApiError,
  requireInstagramApiAccess,
} from "@/lib/instagram/api-auth";
import {
  deleteInstagramGrant,
  listInstagramGrants,
  upsertInstagramGrant,
} from "@/lib/instagram/grants-repository";
import { listAccounts } from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireInstagramApiAccess({ manageTeam: true });
  if (isInstagramApiError(ctx)) return ctx;
  const grants = await listInstagramGrants();
  return NextResponse.json({ grants });
}

export async function POST(request: Request) {
  const ctx = await requireInstagramApiAccess({ manageTeam: true });
  if (isInstagramApiError(ctx)) return ctx;

  const body = (await request.json()) as Record<string, unknown>;
  const email = String(body.email ?? "").trim();
  const label = body.label ? String(body.label).trim() : null;
  const instagramAccountId = body.instagramAccountId
    ? String(body.instagramAccountId).trim()
    : null;

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  if (instagramAccountId) {
    const accounts = await listAccounts();
    if (!accounts.some((a) => a.id === instagramAccountId)) {
      return NextResponse.json({ error: "Unknown account" }, { status: 400 });
    }
  }

  const grant = await upsertInstagramGrant({
    email,
    label,
    instagramAccountId,
    createdBy: ctx.session.email,
  });
  return NextResponse.json({ grant });
}

export async function DELETE(request: Request) {
  const ctx = await requireInstagramApiAccess({ manageTeam: true });
  if (isInstagramApiError(ctx)) return ctx;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  await deleteInstagramGrant(id);
  return NextResponse.json({ ok: true });
}