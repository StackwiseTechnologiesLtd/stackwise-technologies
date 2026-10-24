import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { promoteGrowthLeadToCrm } from "@/lib/crm/repository";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { leadId?: string };
  const leadId = body.leadId?.trim();
  if (!leadId) {
    return NextResponse.json({ error: "leadId is required" }, { status: 400 });
  }

  try {
    const detail = await promoteGrowthLeadToCrm(leadId);
    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Promote failed";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
