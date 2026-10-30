import { NextResponse } from "next/server";
import { OtpLockedError } from "@/lib/otp/lockout";
import { OtpThrottleError } from "@/lib/otp/throttle";
import { sendBrandPortalLoginOtpForEmail } from "@/lib/branding-portal/otp";
import { parsePortalEmail } from "@/lib/branding-portal/validation";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown };
    const email = parsePortalEmail(body.email);
    if (!email) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }

    const result = await sendBrandPortalLoginOtpForEmail(email);
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
