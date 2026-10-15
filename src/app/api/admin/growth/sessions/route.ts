import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { listCredentialStatus } from "@/lib/growth/repository";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const platforms = await listCredentialStatus();
    return NextResponse.json({ platforms });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load sessions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
