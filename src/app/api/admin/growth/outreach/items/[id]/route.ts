import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import {
  outreachResponseStatuses,
  type OutreachResponseStatus,
} from "@/lib/growth/outreach-types";
import { updateOutreachItemResponse } from "@/lib/growth/outreach-run";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: { responseStatus?: string; responseNotes?: string | null } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON body required" }, { status: 400 });
  }

  const status = body.responseStatus?.trim() as OutreachResponseStatus | undefined;
  if (!status || !outreachResponseStatuses.includes(status)) {
    return NextResponse.json(
      { error: `responseStatus must be one of: ${outreachResponseStatuses.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const item = await updateOutreachItemResponse(id, {
      responseStatus: status,
      responseNotes: body.responseNotes,
    });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
