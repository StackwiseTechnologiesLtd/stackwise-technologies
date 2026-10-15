import { EMAIL, SITE_NAME } from "@/lib/content";

export const COMPANY_RC = "9398438";
export const COMPANY_TAGLINE = "Engineering that delivers.";
export const COMPANY_WEBSITE = "stackwisetechnologies.com";
export const COMPANY_WEBSITE_URL = `https://${COMPANY_WEBSITE}`;
export const BRAND_BURGUNDY = "#541111";

export const companyFooterLines = [
  SITE_NAME,
  `RC: ${COMPANY_RC}`,
  `${EMAIL}`,
] as const;
