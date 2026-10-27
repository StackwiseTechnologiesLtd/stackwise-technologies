import type { BrandGuidelines } from "../types";
import { aetheriBrand } from "./aetheri";
import { opsisBrand } from "./opsis";

const brands: Record<string, BrandGuidelines> = {
  [opsisBrand.slug]: opsisBrand,
  [aetheriBrand.slug]: aetheriBrand,
};

export function getBrand(slug: string): BrandGuidelines | undefined {
  return brands[slug];
}

export function listBrands(): BrandGuidelines[] {
  return Object.values(brands);
}
