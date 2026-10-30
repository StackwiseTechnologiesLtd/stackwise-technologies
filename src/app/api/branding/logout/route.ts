import { NextResponse } from "next/server";
import { clearBrandPortalSessionCookie } from "@/lib/branding-portal/session";

export async function POST() {
  await clearBrandPortalSessionCookie();
  return NextResponse.json({ ok: true });
}
