import type { GrowthPlatform } from "@/lib/growth/types";

export const platformLogin: Record<GrowthPlatform, string> = {
  linkedin: "https://www.linkedin.com/login",
  x: "https://x.com/i/flow/login",
};

export const platformHome: Record<GrowthPlatform, string> = {
  linkedin: "https://www.linkedin.com/feed/",
  x: "https://x.com/home",
};

/** Session check landing page before search harvest. */
export const platformSessionCheck: Record<GrowthPlatform, string> = {
  linkedin: "https://www.linkedin.com/feed/",
  x: "https://x.com/home",
};

export const sessionCookieName: Record<GrowthPlatform, string> = {
  linkedin: "li_at",
  x: "auth_token",
};
