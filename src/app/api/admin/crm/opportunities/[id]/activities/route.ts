import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { addOpportunityActivity } from "@/lib/crm/repository";
import { crmActivityTypes, type CrmActivityType } from "@/lib/crm/types";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    body?: string;
    activityType?: CrmActivityType;
  };

  if (
    body.activityType &&
    !crmActivityTypes.includes(body.activityType)
  ) {
    return NextResponse.json({ error: "Invalid activity type" }, { status: 400 });
  }

  try {
    const activity = await addOpportunityActivity(id, {
      body: body.body ?? "",
      activityType: body.activityType,
    });
    if (!activity) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ activity });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
