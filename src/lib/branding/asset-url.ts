export function brandAssetUrl(path: string): string {
  const normalized = path.replace(/^\//, "");
  return `/branding/opsis/${normalized}`;
}
