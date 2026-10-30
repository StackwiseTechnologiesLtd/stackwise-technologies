import type { BrandAssetStorage } from "./types";

export function brandAssetUrl(
  slug: string,
  path: string,
  storage: BrandAssetStorage = "code",
): string {
  const normalized = path.replace(/^\//, "");
  if (storage === "database") {
    return `/api/branding/assets/${slug}/${normalized}`;
  }
  return `/branding/${slug}/${normalized}`;
}

export function brandPreviewUrl(
  slug: string,
  previewId: string,
  width: 400 | 800 | 1600,
  storage: BrandAssetStorage = "code",
): string {
  const path = `previews/${previewId}-${width}.webp`;
  return brandAssetUrl(slug, path, storage);
}

export function brandPreviewSrcSet(
  slug: string,
  previewId: string,
  storage: BrandAssetStorage = "code",
): string {
  return [
    `${brandPreviewUrl(slug, previewId, 400, storage)} 400w`,
    `${brandPreviewUrl(slug, previewId, 800, storage)} 800w`,
    `${brandPreviewUrl(slug, previewId, 1600, storage)} 1600w`,
  ].join(", ");
}

export function brandStorageOf(
  brand: { storage?: BrandAssetStorage },
): BrandAssetStorage {
  return brand.storage ?? "code";
}
