import type { Metadata } from "next";
import { COMPANY_WEBSITE_URL } from "@/lib/company";
import { SITE_NAME } from "@/lib/content";

const DEFAULT_OG_IMAGE = `${COMPANY_WEBSITE_URL}/images/og-landing-1200x630.png`;

export function publicSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? COMPANY_WEBSITE_URL;
}

export function absoluteUrl(path = ""): string {
  const base = publicSiteUrl().replace(/\/$/, "");
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

const FAVICON: NonNullable<Metadata["icons"]> = [
  {
    rel: "icon",
    type: "image/svg+xml",
    url: "/favicon.svg",
  },
];

type PageMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path = "",
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    icons: FAVICON,
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}
