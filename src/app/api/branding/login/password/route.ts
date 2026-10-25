import { NextResponse } from "next/server";
import { getBrand } from "@/lib/branding/brands";
import { normalizeBrandSlug, normalizePortalEmail } from "@/lib/branding-portal/identity";
import { verifyMemberPassword } from "@/lib/branding-portal/members";
import {
  createBrandPortalSessionToken,
  setBrandPortalSessionCookie,
} from "@/lib/branding-portal/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      brandSlug?: string;
      email?: string;
      password?: string;
    };

    const brandSlug = normalizeBrandSlug(body.brandSlug ?? "");
    const email = normalizePortalEmail(body.email ?? "");
    const password = body.password ?? "";

    if (!brandSlug || !email || !password || !getBrand(brandSlug)) {
      return NextResponse.json(
        { error: "Project or password is incorrect." },
        { status: 401 },
      );
    }

    const member = await verifyMemberPassword(brandSlug, email, password);
    if (!member) {
      return NextResponse.json(
        { error: "Project or password is incorrect." },
        { status: 401 },
      );
    }

    const token = await createBrandPortalSessionToken(member.email, member.brandSlug);
    await setBrandPortalSessionCookie(token);
    return NextResponse.json({ ok: true, brandSlug: member.brandSlug });
  } catch {
    return NextResponse.json(
      { error: "Project or password is incorrect." },
      { status: 401 },
    );
  }
}
