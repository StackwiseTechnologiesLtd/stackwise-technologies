import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { getDatabaseBrand, putDatabaseAsset } from "@/lib/branding/db/repository";
import { normalizeBrandSlug } from "@/lib/branding-portal/identity";

type RouteContext = { params: Promise<{ slug: string }> };

const MAX_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = normalizeBrandSlug((await context.params).slug);
  if (!slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const brand = await getDatabaseBrand(slug, true);
  if (!brand) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const form = await request.formData();
  const assetPath = form.get("assetPath");
  const file = form.get("file");
  if (typeof assetPath !== "string" || !assetPath.trim()) {
    return NextResponse.json({ error: "assetPath required" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 15MB)" }, { status: 400 });
  }
  if (assetPath.includes("..") || assetPath.startsWith("/")) {
    return NextResponse.json({ error: "Invalid assetPath" }, { status: 400 });
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";
  await putDatabaseAsset(slug, assetPath, buffer, contentType);

  return NextResponse.json({ ok: true, assetPath, byteSize: buffer.byteLength });
}
