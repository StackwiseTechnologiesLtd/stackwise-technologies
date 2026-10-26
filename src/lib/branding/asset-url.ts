export function brandAssetUrl(slug: string, path: string): string {
  const normalized = path.replace(/^\//, "");
  return `/branding/${slug}/${normalized}`;
}

export function brandPreviewUrl(
  slug: string,
  previewId: string,
  width: 400 | 800 | 1600,
): string {
  return `/branding/${slug}/previews/${previewId}-${width}.webp`;
}

export function brandPreviewSrcSet(slug: string, previewId: string): string {
  return [
    `${brandPreviewUrl(slug, previewId, 400)} 400w`,
    `${brandPreviewUrl(slug, previewId, 800)} 800w`,
    `${brandPreviewUrl(slug, previewId, 1600)} 1600w`,
  ].join(", ");
}
