import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import {
  createMember,
  listMembers,
  setMemberActive,
} from "@/lib/branding-portal/members";
import {
  parsePortalAuthMethod,
  parsePortalBrandSlug,
  parsePortalEmail,
  parsePortalMemberId,
  parsePortalPasswordForCreate,
} from "@/lib/branding-portal/validation";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brandSlug = parsePortalBrandSlug(
    new URL(request.url).searchParams.get("brandSlug") ?? "",
  );
  if (!brandSlug) {
    return NextResponse.json({ error: "Invalid brandSlug" }, { status: 400 });
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
    brandSlug?: unknown;
    email?: unknown;
    authMethod?: unknown;
    password?: unknown;
  };

  const brandSlug = parsePortalBrandSlug(body.brandSlug);
  const email = parsePortalEmail(body.email);
  const authMethod = parsePortalAuthMethod(body.authMethod);

  if (!brandSlug || !email) {
    return NextResponse.json({ error: "Invalid brand or email" }, { status: 400 });
  }

  const password =
    authMethod === "password" ? parsePortalPasswordForCreate(body.password) : null;
  if (authMethod === "password" && body.password != null && body.password !== "" && !password) {
    return NextResponse.json(
      { error: "Password must be 8–128 characters with no control characters" },
      { status: 400 },
    );
  }

  try {
    const { member, temporaryPassword } = await createMember({
      brandSlug,
      email,
      authMethod,
      password: password ?? undefined,
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

  const body = (await request.json()) as { id?: unknown; active?: unknown };
  const id = parsePortalMemberId(body.id);
  if (!id || typeof body.active !== "boolean") {
    return NextResponse.json({ error: "Invalid id or active flag" }, { status: 400 });
  }

  try {
    await setMemberActive(id, body.active);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update member" },
      { status: 400 },
    );
  }
}
