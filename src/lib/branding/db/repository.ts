import { asRows, getSql, isDatabaseConfigured } from "@/lib/db/postgres";
import type { BrandGuidelines } from "../types";
import { parseBrandGuidelinesConfig } from "./validate-config";

type BrandRow = {
  slug: string;
  published: boolean;
  config: BrandGuidelines;
};

type AssetRow = {
  content_type: string;
  data: Uint8Array | Buffer;
};

export function brandUsesDatabaseStorage(brand: BrandGuidelines): boolean {
  return brand.storage === "database";
}

export async function listDatabaseBrands(
  includeUnpublished = false,
): Promise<BrandGuidelines[]> {
  if (!isDatabaseConfigured()) return [];
  const sql = getSql();
  const rows = asRows<BrandRow>(
    includeUnpublished
      ? await sql`SELECT slug, published, config FROM brand_guidelines ORDER BY slug`
      : await sql`SELECT slug, published, config FROM brand_guidelines WHERE published = TRUE ORDER BY slug`,
  );
  return rows.map((row) => ({
    ...parseBrandGuidelinesConfig(
      typeof row.config === "string" ? JSON.parse(row.config) : row.config,
    ),
    storage: "database" as const,
    published: row.published,
  }));
}

export async function getDatabaseBrand(
  slug: string,
  includeUnpublished = false,
): Promise<BrandGuidelines | undefined> {
  if (!isDatabaseConfigured()) return undefined;
  const sql = getSql();
  const rows = asRows<BrandRow>(
    includeUnpublished
      ? await sql`SELECT slug, published, config FROM brand_guidelines WHERE slug = ${slug} LIMIT 1`
      : await sql`SELECT slug, published, config FROM brand_guidelines WHERE slug = ${slug} AND published = TRUE LIMIT 1`,
  );
  const row = rows[0];
  if (!row) return undefined;
  return {
    ...parseBrandGuidelinesConfig(
      typeof row.config === "string" ? JSON.parse(row.config) : row.config,
    ),
    storage: "database",
    published: row.published,
  };
}

export async function brandExistsInDatabase(slug: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  const sql = getSql();
  const rows = asRows<{ slug: string }>(
    await sql`SELECT slug FROM brand_guidelines WHERE slug = ${slug} LIMIT 1`,
  );
  return rows.length > 0;
}

export async function upsertDatabaseBrand(input: {
  slug: string;
  published: boolean;
  config: BrandGuidelines;
}): Promise<void> {
  const config = parseBrandGuidelinesConfig({
    ...input.config,
    slug: input.slug,
    storage: "database",
  });
  const sql = getSql();
  await sql`
    INSERT INTO brand_guidelines (slug, published, config, updated_at)
    VALUES (${input.slug}, ${input.published}, ${JSON.stringify(config)}::jsonb, NOW())
    ON CONFLICT (slug) DO UPDATE SET
      published = EXCLUDED.published,
      config = EXCLUDED.config,
      updated_at = NOW()
  `;
}

export async function deleteDatabaseBrand(slug: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM brand_guidelines WHERE slug = ${slug}`;
}

export async function putDatabaseAsset(
  brandSlug: string,
  assetPath: string,
  data: Uint8Array,
  contentType: string,
): Promise<void> {
  const normalized = assetPath.replace(/^\/+/, "");
  const sql = getSql();
  await sql`
    INSERT INTO brand_guideline_assets (brand_slug, asset_path, content_type, data, byte_size, updated_at)
    VALUES (${brandSlug}, ${normalized}, ${contentType}, ${data}, ${data.byteLength}, NOW())
    ON CONFLICT (brand_slug, asset_path) DO UPDATE SET
      content_type = EXCLUDED.content_type,
      data = EXCLUDED.data,
      byte_size = EXCLUDED.byte_size,
      updated_at = NOW()
  `;
}

export async function getDatabaseAsset(
  brandSlug: string,
  assetPath: string,
): Promise<{ contentType: string; data: Uint8Array } | undefined> {
  const normalized = assetPath.replace(/^\/+/, "");
  const sql = getSql();
  const rows = asRows<AssetRow>(
    await sql`
      SELECT content_type, data
      FROM brand_guideline_assets
      WHERE brand_slug = ${brandSlug} AND asset_path = ${normalized}
      LIMIT 1
    `,
  );
  const row = rows[0];
  if (!row) return undefined;
  const bytes =
    row.data instanceof Uint8Array ? row.data : new Uint8Array(row.data);
  return { contentType: row.content_type, data: bytes };
}

export async function listDatabaseAssetPaths(brandSlug: string): Promise<string[]> {
  const sql = getSql();
  const rows = asRows<{ asset_path: string }>(
    await sql`
      SELECT asset_path FROM brand_guideline_assets WHERE brand_slug = ${brandSlug} ORDER BY asset_path
    `,
  );
  return rows.map((r) => r.asset_path);
}
