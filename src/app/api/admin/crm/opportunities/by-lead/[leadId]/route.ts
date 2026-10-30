import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { getOpportunityByGrowthLeadId } from "@/lib/crm/repository";

type Params = { params: Promise<{ leadId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leadId } = await params;
  try {
    const opportunity = await getOpportunityByGrowthLeadId(leadId);
    if (!opportunity) {
      return NextResponse.json({ opportunity: null });
    }
    return NextResponse.json({ opportunity });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
