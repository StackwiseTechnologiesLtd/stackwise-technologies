import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/session";
import { getBrand } from "@/lib/branding/brands";
import {
  BRAND_PORTAL_COOKIE,
  verifyBrandPortalSessionToken,
} from "@/lib/branding-portal/session";

export type BrandingViewer =
  | { mode: "admin"; email: string }
  | { mode: "portal"; email: string; brandSlug: string };

const ADMIN_COOKIE = "sw_admin_session";

function readCookieFromHeader(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return undefined;
}

async function readCookie(name: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  const fromStore = cookieStore.get(name)?.value;
  if (fromStore) return fromStore;

  const headerStore = await headers();
  return readCookieFromHeader(headerStore.get("cookie"), name);
}

async function safeVerifyAdmin(token: string | undefined) {
  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

async function safeVerifyPortal(token: string | undefined) {
  if (!token) return null;
  try {
    return await verifyBrandPortalSessionToken(token);
  } catch {
    return null;
  }
}

export async function getBrandingViewer(): Promise<BrandingViewer | null> {
  const adminToken = await readCookie(ADMIN_COOKIE);
  const admin = await safeVerifyAdmin(adminToken);
  if (admin) {
    return { mode: "admin", email: admin.email };
  }

  const portalToken = await readCookie(BRAND_PORTAL_COOKIE);
  const portal = await safeVerifyPortal(portalToken);
  if (portal) {
    return {
      mode: "portal",
      email: portal.email,
      brandSlug: portal.brandSlug,
    };
  }

  return null;
}

export function getBrandingSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/branding\/([a-z0-9-]+)$/);
  return match?.[1] ?? null;
}

export function isBrandingPortalPagePath(pathname: string): boolean {
  if (pathname === "/branding/login") return false;
  if (pathname === "/branding") return true;
  return getBrandingSlugFromPath(pathname) !== null;
}

export async function getBrandingViewerFromRequest(
  request: NextRequest,
): Promise<BrandingViewer | null> {
  const admin = await safeVerifyAdmin(request.cookies.get(ADMIN_COOKIE)?.value);
  if (admin) {
    return { mode: "admin", email: admin.email };
  }

  const portal = await safeVerifyPortal(request.cookies.get(BRAND_PORTAL_COOKIE)?.value);
  if (portal) {
    return {
      mode: "portal",
      email: portal.email,
      brandSlug: portal.brandSlug,
    };
  }

  return null;
}

export async function canAccessBrandingRoute(
  request: NextRequest,
  pathname: string,
): Promise<boolean> {
  const viewer = await getBrandingViewerFromRequest(request);
  if (!viewer) return false;

  const slug = getBrandingSlugFromPath(pathname);
  if (!slug) return true;

  return viewerCanAccessBrand(viewer, slug);
}

export function viewerCanAccessBrand(viewer: BrandingViewer, slug: string): boolean {
  if (!getBrand(slug)) return false;
  if (viewer.mode === "admin") return true;
  return viewer.brandSlug === slug;
}
