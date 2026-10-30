import type { NextRequest } from "next/server";
import {
  canAccessBrandingRoute,
  getBrandingSlugFromPath,
  getBrandingViewerFromRequest,
} from "@/lib/branding-portal/access";

export async function canAccessBrandPortalAsset(
  request: NextRequest,
  brandSlug: string | null,
): Promise<boolean> {
  const viewer = await getBrandingViewerFromRequest(request);
  if (!viewer) return false;
  if (viewer.mode === "admin") return true;
  if (!brandSlug) return true;
  return viewer.brandSlug === brandSlug;
}

export { canAccessBrandingRoute, getBrandingSlugFromPath };
