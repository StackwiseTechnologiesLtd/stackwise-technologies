import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { getIntegrationsStatus } from "@/lib/integrations/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await getIntegrationsStatus();
    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Status failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
