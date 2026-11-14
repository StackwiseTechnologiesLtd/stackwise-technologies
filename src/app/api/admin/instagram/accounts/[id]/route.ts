import { NextResponse } from "next/server";
import { filterByAccountAccess } from "@/lib/instagram/access";
import {
  isInstagramApiError,
  requireAccountScope,
  requireInstagramApiAccess,
} from "@/lib/instagram/api-auth";
import { deleteInstagramAccount, listAccounts } from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireInstagramApiAccess({ manageMeta: true });
  if (isInstagramApiError(ctx)) return ctx;
  const { id } = await context.params;
  const account = filterByAccountAccess(await listAccounts(), ctx.access).find(
    (a) => a.id === id,
  );
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  const scopeErr = requireAccountScope(ctx.access, id);
  if (scopeErr) return scopeErr;

  try {
    await deleteInstagramAccount(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}