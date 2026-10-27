import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { createBrandGuidelinesTemplate } from "@/lib/branding/db/default-template";
import {
  listDatabaseBrands,
  upsertDatabaseBrand,
} from "@/lib/branding/db/repository";
import { brandExistsAsync } from "@/lib/branding/brands";
import { normalizeBrandSlug } from "@/lib/branding-portal/identity";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brands = await listDatabaseBrands(true);
  return NextResponse.json({
    brands: brands.map((b) => ({
      slug: b.slug,
      name: b.name,
      published: b.published ?? false,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { slug?: unknown; name?: unknown };
  const slug = normalizeBrandSlug(
    typeof body.slug === "string" ? body.slug : "",
  );
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (await brandExistsAsync(slug)) {
    return NextResponse.json({ error: "Brand slug already exists" }, { status: 409 });
  }

  const config = createBrandGuidelinesTemplate(slug, name);
  await upsertDatabaseBrand({ slug, published: false, config });

  return NextResponse.json({ slug, config });
}
