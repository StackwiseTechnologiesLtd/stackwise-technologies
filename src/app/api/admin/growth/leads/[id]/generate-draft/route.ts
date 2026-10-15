import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { generateDraftForLead } from "@/lib/growth/repository";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const result = await generateDraftForLead(id);
    if (!result) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
