import { NextResponse } from "next/server";
import { OtpLockedError } from "@/lib/otp/lockout";
import { OtpThrottleError } from "@/lib/otp/throttle";
import { sendAdminLoginOtp } from "@/lib/otp/admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim() ?? "";
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const result = await sendAdminLoginOtp(email);
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
