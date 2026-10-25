export function brandAssetUrl(path: string): string {
  const normalized = path.replace(/^\//, "");
  return `/branding/opsis/${normalized}`;
}

export function brandPreviewUrl(previewId: string, width: 400 | 800 | 1600): string {
  return `/branding/opsis/previews/${previewId}-${width}.webp`;
}

export function brandPreviewSrcSet(previewId: string): string {
  return [
    `${brandPreviewUrl(previewId, 400)} 400w`,
    `${brandPreviewUrl(previewId, 800)} 800w`,
    `${brandPreviewUrl(previewId, 1600)} 1600w`,
  ].join(", ");
}
