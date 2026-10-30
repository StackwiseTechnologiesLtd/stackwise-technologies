import type { MetadataRoute } from "next";
import { locales } from "@/lib/content";
import { absoluteUrl } from "@/lib/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const marketing = locales.map((locale) => ({
    url: absoluteUrl(`/${locale}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: locale === "en" ? 1 : 0.9,
  }));

  return [
    ...marketing,
    {
      url: absoluteUrl("/llms.txt"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/llms-full.txt"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];
}
