import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { patchCampaign } from "@/lib/instagram/repository";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const campaign = await patchCampaign(id, {
      active: typeof body.active === "boolean" ? body.active : undefined,
    });
    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}