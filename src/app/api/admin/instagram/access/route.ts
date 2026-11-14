import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { getInstagramAccessForEmail } from "@/lib/instagram/access";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const access = await getInstagramAccessForEmail(session.email);
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({
    email: access.email,
    kind: access.kind,
    accountIds: access.accountIds,
    canManageMetaApps: access.canManageMetaApps,
    canManageTeam: access.canManageTeam,
  });
}