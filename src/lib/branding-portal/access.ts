import { getAdminSession } from "@/lib/auth/session";
import { getBrand } from "@/lib/branding/brands";
import { getBrandPortalSession } from "@/lib/branding-portal/session";

export type BrandingViewer =
  | { mode: "admin"; email: string }
  | { mode: "portal"; email: string; brandSlug: string };

export async function getBrandingViewer(): Promise<BrandingViewer | null> {
  const admin = await getAdminSession();
  if (admin) {
    return { mode: "admin", email: admin.email };
  }

  const portal = await getBrandPortalSession();
  if (portal) {
    return {
      mode: "portal",
      email: portal.email,
      brandSlug: portal.brandSlug,
    };
  }

  return null;
}

export function viewerCanAccessBrand(viewer: BrandingViewer, slug: string): boolean {
  if (!getBrand(slug)) return false;
  if (viewer.mode === "admin") return true;
  return viewer.brandSlug === slug;
}
