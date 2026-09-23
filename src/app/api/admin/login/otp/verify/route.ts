import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { OtpLockedError } from "@/lib/otp/lockout";
import { verifyAdminLoginOtp } from "@/lib/otp/admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; otp?: string };
    const email = body.email?.trim() ?? "";
    const otp = body.otp?.trim() ?? "";

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 },
      );
    }

    const verified = await verifyAdminLoginOtp(email, otp);
    const token = await createSessionToken(verified.email);
    await setSessionCookie(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof OtpLockedError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid code" },
      { status: 401 },
    );
  }
}
