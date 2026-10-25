import type { BrandGuidelines } from "../types";
import { opsisBrand } from "./opsis";

const brands: Record<string, BrandGuidelines> = {
  [opsisBrand.slug]: opsisBrand,
};

export function getBrand(slug: string): BrandGuidelines | undefined {
  return brands[slug];
}

export function listBrands(): BrandGuidelines[] {
  return Object.values(brands);
}
