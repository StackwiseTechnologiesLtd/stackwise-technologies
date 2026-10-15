import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { updateLead } from "@/lib/growth/repository";
import { pipelineStatuses, type PipelineStatus } from "@/lib/growth/types";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    pipelineStatus?: PipelineStatus;
    feedbackNote?: string | null;
  };

  if (
    body.pipelineStatus &&
    !pipelineStatuses.includes(body.pipelineStatus)
  ) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const lead = await updateLead(id, body);
    if (!lead) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
