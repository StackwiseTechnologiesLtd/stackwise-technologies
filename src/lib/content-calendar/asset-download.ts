/** Force `Content-Disposition: attachment` on the admin asset file route. */
export function contentCalendarAssetDownloadUrl(fileUrl: string): string {
  const sep = fileUrl.includes("?") ? "&" : "?";
  return `${fileUrl}${sep}download=1`;
}

export function contentDispositionFilename(name: string): string {
  const base = name.replace(/[\r\n"\\]/g, "_").slice(0, 180);
  return base || "download";
}