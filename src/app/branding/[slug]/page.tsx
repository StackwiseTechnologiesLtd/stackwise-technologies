import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBrand } from "@/lib/branding/brands";
import { BrandGuidelinesPage } from "@/components/branding/BrandGuidelinesPage";

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

  return <BrandGuidelinesPage brand={brand} />;
}
