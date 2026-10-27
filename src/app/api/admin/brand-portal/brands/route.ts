import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { listBrandsAsync } from "@/lib/branding/brands";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brands = await listBrandsAsync({ includeUnpublished: true });
  return NextResponse.json({
    brands: brands.map((b) => ({
      slug: b.slug,
      name: b.name,
      storage: b.storage ?? "code",
      published: b.published ?? true,
    })),
  });
}
