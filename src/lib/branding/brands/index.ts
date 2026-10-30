import type { BrandGuidelines } from "../types";
import {
  brandExistsInDatabase,
  getDatabaseBrand,
  listDatabaseBrands,
} from "../db/repository";
import { aetheriBrand } from "./aetheri";
import { opsisBrand } from "./opsis";

const codeBrands: Record<string, BrandGuidelines> = {
  [opsisBrand.slug]: opsisBrand,
  [aetheriBrand.slug]: aetheriBrand,
};

export function getCodeBrand(slug: string): BrandGuidelines | undefined {
  return codeBrands[slug];
}

/** Sync lookup for in-repo brands only (tests and static fallbacks). */
export function getBrand(slug: string): BrandGuidelines | undefined {
  return codeBrands[slug];
}

export function listCodeBrands(): BrandGuidelines[] {
  return Object.values(codeBrands);
}

export async function getBrandAsync(
  slug: string,
  options?: { includeUnpublished?: boolean },
): Promise<BrandGuidelines | undefined> {
  const fromDb = await getDatabaseBrand(slug, options?.includeUnpublished);
  if (fromDb) return fromDb;
  return codeBrands[slug];
}

export async function listBrandsAsync(
  options?: { includeUnpublished?: boolean },
): Promise<BrandGuidelines[]> {
  const dbBrands = await listDatabaseBrands(options?.includeUnpublished);
  const dbSlugs = new Set(dbBrands.map((b) => b.slug));
  const staticBrands = Object.values(codeBrands).filter((b) => !dbSlugs.has(b.slug));
  return [...dbBrands, ...staticBrands].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export async function brandExistsAsync(slug: string): Promise<boolean> {
  if (codeBrands[slug]) return true;
  return brandExistsInDatabase(slug);
}

/** In-repo brands only (sync). Prefer `listBrandsAsync` for portal picker. */
export function listBrands(): BrandGuidelines[] {
  return listCodeBrands();
}
