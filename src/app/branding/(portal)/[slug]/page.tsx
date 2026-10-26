import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getBrand } from "@/lib/branding/brands";
import { BrandGuidelinesPage } from "@/components/branding/BrandGuidelinesPage";
import {
  getBrandingViewer,
  viewerCanAccessBrand,
} from "@/lib/branding-portal/access";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrand(slug);
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
  const brand = getBrand(slug);
  if (!brand) notFound();

  const viewer = await getBrandingViewer();
  if (!viewer) {
    redirect(`/branding/login?next=${encodeURIComponent(`/branding/${slug}`)}`);
  }
  if (!viewerCanAccessBrand(viewer, slug)) {
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
