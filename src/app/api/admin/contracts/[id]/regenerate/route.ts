import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { regenerateContractDraft } from "@/lib/contracts/actions";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const engagement = await regenerateContractDraft(id);
    return NextResponse.json({ engagement });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Regenerate failed";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
