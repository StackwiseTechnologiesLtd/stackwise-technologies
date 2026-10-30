/** Paths under /branding/<slug>/ that may load without a portal session (login chrome only). */
export function isBrandPortalPublicAsset(pathname: string): boolean {
  if (!pathname.startsWith("/branding/")) return false;
  return (
    pathname.endsWith("/brand-fonts.css") ||
    pathname.includes("/preview-fonts/")
  );
}

export function brandSlugFromAssetPath(pathname: string): string | null {
  const match = pathname.match(/^\/branding\/([^/]+)\//);
  return match?.[1] ?? null;
}

export function isBrandPortalProtectedAsset(pathname: string): boolean {
  if (!pathname.startsWith("/branding/")) return false;
  if (isBrandPortalPublicAsset(pathname)) return false;
  const slug = brandSlugFromAssetPath(pathname);
  if (!slug) return false;
  return /\.(avif|webp|png|svg|ico|ttf|css)$/i.test(pathname);
}
