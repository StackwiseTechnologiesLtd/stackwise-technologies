import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, locales } from "@/lib/content";
import {
  brandSlugFromAssetPath,
  isBrandPortalProtectedAsset,
} from "@/lib/branding-portal/static-assets";
import { verifyBrandPortalSessionToken } from "@/lib/branding-portal/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isBrandPortalProtectedAsset(pathname)) {
    const slug = brandSlugFromAssetPath(pathname);
    const token = request.cookies.get("sw_brand_portal_session")?.value;
    try {
      const session = await verifyBrandPortalSessionToken(token);
      if (!session || (slug && session.brandSlug !== slug)) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/branding/login";
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      return NextResponse.redirect(new URL("/branding/login", request.url));
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/branding") ||
    pathname.startsWith("/pay") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (hasLocale) return NextResponse.next();

  const preferred = request.headers
    .get("accept-language")
    ?.split(",")[0]
    ?.slice(0, 2)
    .toLowerCase();
  const locale =
    preferred && locales.includes(preferred as (typeof locales)[number])
      ? preferred
      : defaultLocale;

  const url = request.nextUrl.clone();
  url.pathname =
    pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
