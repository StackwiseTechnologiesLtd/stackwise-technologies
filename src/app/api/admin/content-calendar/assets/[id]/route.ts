import { NextResponse } from "next/server";
import { deleteContentCalendarAsset } from "@/lib/content-calendar/repository";
import { getAdminSession } from "@/lib/auth/session";

type RouteCtx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, ctx: RouteCtx) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  try {
    await deleteContentCalendarAsset(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}