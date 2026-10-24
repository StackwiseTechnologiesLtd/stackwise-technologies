import type { GrowthPlatform } from "@/lib/growth/types";
import { profileUrlFromPost } from "@/lib/growth/profile-enrich";

function absUrl(href: string, origin: string): string {
  return href.startsWith("http") ? href : `${origin}${href}`;
}

function isGrowthPlatform(
  value: GrowthPlatform | string | null | undefined,
): value is GrowthPlatform {
  return value === "linkedin" || value === "x";
}

/** Normalize stored or harvested post URLs for display and deep links. */
export function resolveGrowthPostUrl(input: {
  platform?: GrowthPlatform | string | null;
  sourceUrl?: string | null;
  authorProfileUrl?: string | null;
  authorHandle?: string | null;
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

  if (!isGrowthPlatform(input.platform)) return null;

  const profile = profileUrlFromPost(
    input.platform,
    input.authorProfileUrl,
    input.authorHandle,
  );
  if (profile) return profile;

  const relativeProfile = input.authorProfileUrl?.trim();
  if (relativeProfile) {
    if (input.platform === "linkedin") {
      return absUrl(relativeProfile, "https://www.linkedin.com");
    }
    if (input.platform === "x") {
      return absUrl(relativeProfile, "https://x.com");
    }
  }

  return null;
}

export function isDirectPostUrl(
  platform: GrowthPlatform | string | null | undefined,
  href: string,
): boolean {
  if (platform === "x") {
    return (
      /\/status\/\d+/i.test(href) ||
      (href.includes("x.com") && href.includes("/status/"))
    );
  }
  if (platform === "linkedin") {
    return (
      href.includes("/feed/update/") ||
      href.includes("/posts/") ||
      href.includes("activity-")
    );
  }
  return href.startsWith("http");
}

export function linkedInFeedUrlFromUrn(urn: string): string {
  return `https://www.linkedin.com/feed/update/${encodeURIComponent(urn)}/`;
}
