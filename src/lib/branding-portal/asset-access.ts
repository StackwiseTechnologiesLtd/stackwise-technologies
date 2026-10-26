import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/session";
import { verifyBrandPortalSessionToken } from "@/lib/branding-portal/session";

export async function canAccessBrandPortalAsset(
  request: NextRequest,
  brandSlug: string | null,
): Promise<boolean> {
  const adminToken = request.cookies.get("sw_admin_session")?.value;
  try {
    if (await verifySessionToken(adminToken)) {
      return true;
    }
  } catch {
    /* secret not configured */
  }

  const portalToken = request.cookies.get("sw_brand_portal_session")?.value;
  try {
    const portal = await verifyBrandPortalSessionToken(portalToken);
    if (!portal) return false;
    if (!brandSlug) return true;
    return portal.brandSlug === brandSlug;
  } catch {
    return false;
  }
}
