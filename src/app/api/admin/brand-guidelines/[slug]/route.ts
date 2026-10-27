import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import {
  deleteDatabaseBrand,
  getDatabaseBrand,
  listDatabaseAssetPaths,
  upsertDatabaseBrand,
} from "@/lib/branding/db/repository";
import { parseBrandGuidelinesConfig } from "@/lib/branding/db/validate-config";
import { standardBrandAssetPaths } from "@/lib/branding/db/asset-manifest";
import { normalizeBrandSlug } from "@/lib/branding-portal/identity";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = normalizeBrandSlug((await context.params).slug);
  if (!slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const brand = await getDatabaseBrand(slug, true);
  if (!brand) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const uploaded = await listDatabaseAssetPaths(slug);
  const slots = standardBrandAssetPaths(slug).map((slot) => ({
    ...slot,
    uploaded: uploaded.includes(slot.path),
  }));

  return NextResponse.json({ brand, assetSlots: slots, uploaded });
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = normalizeBrandSlug((await context.params).slug);
  if (!slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const existing = await getDatabaseBrand(slug, true);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    published?: unknown;
    config?: unknown;
  };

  let config = existing;
  if (body.config !== undefined) {
    config = parseBrandGuidelinesConfig(body.config);
    if (config.slug !== slug) {
      return NextResponse.json({ error: "Slug mismatch in config" }, { status: 400 });
    }
  }

  const published =
    typeof body.published === "boolean" ? body.published : (existing.published ?? false);

  await upsertDatabaseBrand({ slug, published, config });

  const brand = await getDatabaseBrand(slug, true);
  return NextResponse.json({ brand });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = normalizeBrandSlug((await context.params).slug);
  if (!slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  await deleteDatabaseBrand(slug);
  return NextResponse.json({ ok: true });
}
