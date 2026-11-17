import { NextResponse } from "next/server";
import {
  getAgencyProjectDetail,
  updateAgencyProject,
} from "@/lib/agency/projects";
import { agencyProjectStatuses, type AgencyProjectStatus } from "@/lib/agency/types";
import { getAdminSession } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const detail = await getAgencyProjectDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    status?: AgencyProjectStatus;
    title?: string;
    contractEngagementId?: string | null;
    paymentLinkId?: string | null;
  };

  if (
    body.status &&
    !agencyProjectStatuses.includes(body.status)
  ) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const project = await updateAgencyProject(id, body);
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}