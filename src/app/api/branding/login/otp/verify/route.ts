import { NextResponse } from "next/server";
import { OtpLockedError } from "@/lib/otp/lockout";
import { verifyBrandPortalLoginOtpForEmail } from "@/lib/branding-portal/otp";
import {
  createBrandPortalSessionToken,
  setBrandPortalSessionCookie,
} from "@/lib/branding-portal/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      otp?: string;
    };
    const email = body.email?.trim() ?? "";
    const otp = body.otp?.trim() ?? "";
    if (!email || otp.length !== 6) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    }

    const verified = await verifyBrandPortalLoginOtpForEmail(email, otp);
    const token = await createBrandPortalSessionToken(
      verified.email,
      verified.brandSlug,
    );
    await setBrandPortalSessionCookie(token);
    return NextResponse.json({ ok: true, brandSlug: verified.brandSlug });
  } catch (error) {
    if (error instanceof OtpLockedError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    return NextResponse.json(
      { error: "Invalid or expired code" },
      { status: 401 },
    );
  }
}
