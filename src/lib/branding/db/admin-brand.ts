import { getCodeBrand } from "../brands";
import type { BrandAssetStorage, BrandGuidelines } from "../types";
import { getDatabaseBrand, upsertDatabaseBrand } from "./repository";
import { parseBrandGuidelinesConfig } from "./validate-config";

export type AdminBrandRecord = {
  brand: BrandGuidelines;
  storage: BrandAssetStorage;
  published: boolean;
};

export async function loadAdminBrand(slug: string): Promise<AdminBrandRecord | null> {
  const fromDb = await getDatabaseBrand(slug, true);
  if (fromDb) {
    return {
      brand: fromDb,
      storage: "database",
      published: fromDb.published ?? false,
    };
  }
  const fromCode = getCodeBrand(slug);
  if (!fromCode) return null;
  return {
    brand: fromCode,
    storage: "code",
    published: true,
  };
}

/** Ensure a DB row exists (import from code config or upsert). */
export async function ensureDatabaseBrandFromAdmin(
  slug: string,
  config: BrandGuidelines,
  published: boolean,
): Promise<BrandGuidelines> {
  const parsed = parseBrandGuidelinesConfig({ ...config, slug, storage: "database" });
  await upsertDatabaseBrand({ slug, published, config: parsed });
  const saved = await getDatabaseBrand(slug, true);
  if (!saved) throw new Error("Could not save brand");
  return saved;
}
