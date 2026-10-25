import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { listBrands } from "@/lib/branding/brands";
import {
  createMember,
  listMembers,
  setMemberActive,
  type BrandPortalAuthMethod,
} from "@/lib/branding-portal/members";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brandSlug = new URL(request.url).searchParams.get("brandSlug")?.trim() ?? "";
  if (!brandSlug) {
    return NextResponse.json({ error: "brandSlug is required" }, { status: 400 });
  }

  const members = await listMembers(brandSlug);
  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      brandSlug: m.brandSlug,
      email: m.email,
      authMethod: m.authMethod,
      active: m.active,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    brandSlug?: string;
    email?: string;
    authMethod?: BrandPortalAuthMethod;
    password?: string;
  };

  const brandSlug = body.brandSlug?.trim() ?? "";
  if (!listBrands().some((b) => b.slug === brandSlug)) {
    return NextResponse.json({ error: "Unknown brand" }, { status: 400 });
  }

  const authMethod = body.authMethod === "otp" ? "otp" : "password";

  try {
    const { member, temporaryPassword } = await createMember({
      brandSlug,
      email: body.email ?? "",
      authMethod,
      password: body.password,
    });
    return NextResponse.json({
      member: {
        id: member.id,
        brandSlug: member.brandSlug,
        email: member.email,
        authMethod: member.authMethod,
        active: member.active,
      },
      temporaryPassword,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create member" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { id?: string; active?: boolean };
  if (!body.id || typeof body.active !== "boolean") {
    return NextResponse.json({ error: "id and active are required" }, { status: 400 });
  }

  await setMemberActive(body.id, body.active);
  return NextResponse.json({ ok: true });
}
