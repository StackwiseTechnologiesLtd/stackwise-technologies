import { getAdminSession } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function requireGrowthConnectAdmin(): Promise<
  { ok: true } | { ok: false; response: NextResponse }
> {
  const session = await getAdminSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true };
}
