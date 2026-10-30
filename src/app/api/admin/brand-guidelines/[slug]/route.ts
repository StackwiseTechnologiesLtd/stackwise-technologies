import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import {
  deleteDatabaseBrand,
  getDatabaseBrand,
  listDatabaseAssetPaths,
} from "@/lib/branding/db/repository";
import {
  ensureDatabaseBrandFromAdmin,
  loadAdminBrand,
} from "@/lib/branding/db/admin-brand";
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

  const record = await loadAdminBrand(slug);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const uploaded =
    record.storage === "database" ? await listDatabaseAssetPaths(slug) : [];
  const assetSlots = standardBrandAssetPaths(slug).map((slot) => ({
    ...slot,
    uploaded:
      record.storage === "database"
        ? uploaded.includes(slot.path)
        : true,
    repoAssets: record.storage === "code",
  }));

  return NextResponse.json({
    brand: record.brand,
    storage: record.storage,
    published: record.published,
    assetSlots,
    uploaded,
  });
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

  const record = await loadAdminBrand(slug);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    published?: unknown;
    config?: unknown;
  };

  let config = record.brand;
  if (body.config !== undefined) {
    config = parseBrandGuidelinesConfig(body.config);
    if (config.slug !== slug) {
      return NextResponse.json({ error: "Slug mismatch in config" }, { status: 400 });
    }
  }

  const existingDb = await getDatabaseBrand(slug, true);
  const published =
    typeof body.published === "boolean"
      ? body.published
      : existingDb
        ? (existingDb.published ?? false)
        : record.storage === "code"
          ? true
          : false;

  const brand = await ensureDatabaseBrandFromAdmin(slug, config, published);

  return NextResponse.json({
    brand,
    storage: "database" as const,
    importedFromRepo: record.storage === "code" && !existingDb,
  });
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

  const existing = await getDatabaseBrand(slug, true);
  if (!existing) {
    return NextResponse.json(
      { error: "Only database-backed brands can be deleted here" },
      { status: 400 },
    );
  }

  await deleteDatabaseBrand(slug);
  return NextResponse.json({ ok: true });
}
