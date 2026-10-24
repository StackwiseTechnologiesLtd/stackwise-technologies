import type { MetadataRoute } from "next";
import { COMPANY_WEBSITE_URL } from "@/lib/company";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/pay/", "/c/"],
      },
    ],
    sitemap: `${COMPANY_WEBSITE_URL}/sitemap.xml`,
    host: COMPANY_WEBSITE_URL,
  };
}
