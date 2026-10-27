import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDatabaseAsset } from "@/lib/branding/db/repository";
import { normalizeBrandSlug } from "@/lib/branding-portal/identity";
import {
  getBrandingViewerFromRequest,
  viewerCanAccessBrandAsync,
} from "@/lib/branding-portal/access";
import { brandExistsAsync } from "@/lib/branding/brands";

type RouteContext = {
  params: Promise<{ slug: string; path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug: rawSlug, path: pathParts } = await context.params;
  const slug = normalizeBrandSlug(rawSlug);
  if (!slug || pathParts.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!(await brandExistsAsync(slug))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const viewer = await getBrandingViewerFromRequest(request);
  if (!viewer || !(await viewerCanAccessBrandAsync(viewer, slug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assetPath = pathParts.join("/");
  const asset = await getDatabaseAsset(slug, assetPath);
  if (!asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(Buffer.from(asset.data), {
    status: 200,
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
