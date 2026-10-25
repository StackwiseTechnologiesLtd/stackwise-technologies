import { NextResponse } from "next/server";
import { OtpLockedError } from "@/lib/otp/lockout";
import { OtpThrottleError } from "@/lib/otp/throttle";
import { sendBrandPortalLoginOtp } from "@/lib/branding-portal/otp";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { brandSlug?: string; email?: string };
    const brandSlug = body.brandSlug?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    if (!brandSlug || !email) {
      return NextResponse.json({ error: "Email and project are required" }, { status: 400 });
    }

    const result = await sendBrandPortalLoginOtp(brandSlug, email);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof OtpLockedError || error instanceof OtpThrottleError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send code" },
      { status: 500 },
    );
  }
}
