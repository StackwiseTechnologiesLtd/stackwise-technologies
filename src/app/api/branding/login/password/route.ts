import { NextResponse } from "next/server";
import { verifyMemberPasswordByEmail } from "@/lib/branding-portal/members";
import {
  createBrandPortalSessionToken,
  setBrandPortalSessionCookie,
} from "@/lib/branding-portal/session";
import {
  parsePortalEmail,
  parsePortalPasswordForLogin,
} from "@/lib/branding-portal/validation";

const GENERIC_ERROR = "Email or password is incorrect.";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
    };

    const email = parsePortalEmail(body.email);
    const password = parsePortalPasswordForLogin(body.password);

    if (!email || !password) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    const member = await verifyMemberPasswordByEmail(email, password);
    if (!member) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    const token = await createBrandPortalSessionToken(member.email, member.brandSlug);
    await setBrandPortalSessionCookie(token);
    return NextResponse.json({ ok: true, brandSlug: member.brandSlug });
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }
}
