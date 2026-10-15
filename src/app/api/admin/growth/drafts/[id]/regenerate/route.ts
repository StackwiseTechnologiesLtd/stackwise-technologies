import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { regenerateDraftWithAi } from "@/lib/growth/repository";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const result = await regenerateDraftWithAi(id);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Regenerate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
