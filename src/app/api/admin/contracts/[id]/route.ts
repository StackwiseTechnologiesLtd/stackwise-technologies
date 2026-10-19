import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { saveContractDraftEdits } from "@/lib/contracts/actions";
import { getContractEngagementById } from "@/lib/db/contracts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const engagement = await getContractEngagementById(id);
  if (!engagement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ engagement });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    title?: string;
    bodyMarkdown?: string;
  };

  try {
    const engagement = await saveContractDraftEdits(id, body);
    return NextResponse.json({ engagement });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
