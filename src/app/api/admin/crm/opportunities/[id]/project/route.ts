import { NextResponse } from "next/server";
import { getProjectByOpportunityId } from "@/lib/agency/projects";
import { getAdminSession } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const project = await getProjectByOpportunityId(id);
    return NextResponse.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}