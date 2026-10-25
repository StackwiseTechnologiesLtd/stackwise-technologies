import { NextResponse } from "next/server";
import { OtpLockedError } from "@/lib/otp/lockout";
import { verifyBrandPortalLoginOtpForEmail } from "@/lib/branding-portal/otp";
import { parsePortalEmail, parsePortalOtp } from "@/lib/branding-portal/validation";
import {
  createBrandPortalSessionToken,
  setBrandPortalSessionCookie,
} from "@/lib/branding-portal/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      otp?: unknown;
    };
    const email = parsePortalEmail(body.email);
    const otp = parsePortalOtp(body.otp);
    if (!email || !otp) {
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
