import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getBrandAsync } from "@/lib/branding/brands";
import { BrandGuidelinesPage } from "@/components/branding/BrandGuidelinesPage";
import {
  getBrandingViewer,
  viewerCanAccessBrandAsync,
} from "@/lib/branding-portal/access";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandAsync(slug, { includeUnpublished: true });
  if (!brand) {
    return { title: "Brand guidelines" };
  }
  return {
    title: brand.metaTitle,
    description: brand.metaDescription,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function BrandGuidelineSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const viewer = await getBrandingViewer();
  const includeUnpublished = viewer?.mode === "admin";
  const brand = await getBrandAsync(slug, { includeUnpublished });
  if (!brand) notFound();

  if (!viewer) {
    redirect(`/branding/login?next=${encodeURIComponent(`/branding/${slug}`)}`);
  }
  if (!(await viewerCanAccessBrandAsync(viewer, slug))) {
    redirect(viewer.mode === "portal" ? `/branding/${viewer.brandSlug}` : "/branding");
  }

  return (
    <BrandGuidelinesPage
      brand={brand}
      portalEmail={viewer.mode === "portal" ? viewer.email : undefined}
      adminPreview={viewer.mode === "admin"}
      adminEmail={viewer.mode === "admin" ? viewer.email : undefined}
    />
  );
}
