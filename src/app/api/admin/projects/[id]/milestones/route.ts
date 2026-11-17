import { NextResponse } from "next/server";
import { createProjectMilestone } from "@/lib/agency/projects";
import { getAdminSession } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    title?: string;
    dueAt?: string | null;
    sortOrder?: number;
  };

  try {
    const milestone = await createProjectMilestone(id, {
      title: body.title ?? "",
      dueAt: body.dueAt,
      sortOrder: body.sortOrder,
    });
    if (!milestone) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ milestone });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}