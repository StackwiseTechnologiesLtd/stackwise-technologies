import { NextResponse } from "next/server";
import { ensureProjectFromOpportunity, listAgencyProjects } from "@/lib/agency/projects";
import { agencyProjectStatuses, type AgencyProjectStatus } from "@/lib/agency/types";
import { getAdminSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const status =
    statusParam && agencyProjectStatuses.includes(statusParam as AgencyProjectStatus)
      ? (statusParam as AgencyProjectStatus)
      : null;

  try {
    const projects = await listAgencyProjects({ status });
    return NextResponse.json({ projects });
  } catch (error) {
    const message = error instanceof Error ? error.message : "List failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { opportunityId?: string };
  if (!body.opportunityId?.trim()) {
    return NextResponse.json({ error: "opportunityId is required" }, { status: 400 });
  }

  try {
    const detail = await ensureProjectFromOpportunity(body.opportunityId.trim());
    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}