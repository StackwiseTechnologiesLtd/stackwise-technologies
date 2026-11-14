import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import type { InstagramAccess } from "@/lib/instagram/access";
import {
  accountAllowed,
  getInstagramAccessForEmail,
} from "@/lib/instagram/access";

type SessionPayload = { email: string; exp: number };

export type InstagramApiContext = {
  session: SessionPayload;
  access: InstagramAccess;
};

export async function requireInstagramApiAccess(options?: {
  manageMeta?: boolean;
  manageTeam?: boolean;
}): Promise<InstagramApiContext | NextResponse> {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const access = await getInstagramAccessForEmail(session.email);
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (options?.manageMeta && !access.canManageMetaApps) {
    return NextResponse.json({ error: "Meta app admin only" }, { status: 403 });
  }
  if (options?.manageTeam && !access.canManageTeam) {
    return NextResponse.json({ error: "Team admin only" }, { status: 403 });
  }
  return { session, access };
}

export function requireAccountScope(
  access: InstagramAccess,
  accountId: string,
): NextResponse | null {
  if (!accountAllowed(access, accountId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export function isInstagramApiError(
  value: InstagramApiContext | NextResponse,
): value is NextResponse {
  return value instanceof NextResponse;
}