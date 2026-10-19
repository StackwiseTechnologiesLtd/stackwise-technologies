import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { approveAndSendContractToClient } from "@/lib/contracts/actions";

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
    const engagement = await approveAndSendContractToClient(id);
    return NextResponse.json({ engagement });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
