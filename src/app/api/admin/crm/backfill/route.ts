import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { backfillCrmFromGrowthLeads } from "@/lib/crm/repository";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  const limit =
    typeof body.limit === "number" && body.limit > 0
      ? Math.min(body.limit, 2000)
      : 500;

  try {
    const result = await backfillCrmFromGrowthLeads({ limit });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backfill failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
