import type { GrowthPlatform } from "@/lib/growth/types";

function absUrl(href: string, origin: string): string {
  return href.startsWith("http") ? href : `${origin}${href}`;
}

/** Normalize stored or harvested post URLs for display and deep links. */
export function resolveGrowthPostUrl(input: {
  platform?: GrowthPlatform | string | null;
  sourceUrl?: string | null;
  authorProfileUrl?: string | null;
}): string | null {
  const raw = input.sourceUrl?.trim();
  if (raw) {
    if (
      input.platform === "x" ||
      raw.includes("x.com") ||
      raw.includes("twitter.com")
    ) {
      if (raw.startsWith("http")) {
        return raw.replace(/^https?:\/\/twitter\.com/i, "https://x.com");
      }
      return absUrl(raw, "https://x.com");
    }
    if (
      input.platform === "linkedin" ||
      raw.includes("linkedin.com")
    ) {
      if (raw.startsWith("http")) return raw;
      return absUrl(raw, "https://www.linkedin.com");
    }
    return raw.startsWith("http") ? raw : null;
  }

  if (input.platform === "linkedin" && input.authorProfileUrl?.trim()) {
    const profile = input.authorProfileUrl.trim();
    return profile.startsWith("http")
      ? profile
      : `https://www.linkedin.com${profile}`;
  }

  return null;
}

export function linkedInFeedUrlFromUrn(urn: string): string {
  return `https://www.linkedin.com/feed/update/${encodeURIComponent(urn)}/`;
}
