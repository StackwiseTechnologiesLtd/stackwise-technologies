import { growthDetectAccountLabelInPage } from "@/lib/growth/detect-account-label-in-page";
import type { BrowserPage } from "@/lib/growth/profile-enrich";
import type { GrowthPlatform, PlatformCredentialStatus } from "@/lib/growth/types";

export async function detectAccountLabelOnPage(
  page: BrowserPage,
  platform: GrowthPlatform,
): Promise<string | null> {
  try {
    const label = await page.evaluate(growthDetectAccountLabelInPage, platform);
    return label?.trim() || null;
  } catch {
    return null;
  }
}

export function platformAccountDisplay(
  status: PlatformCredentialStatus,
): string | null {
  const label =
    status.connectedAccountLabel?.trim() || status.displayLabel?.trim() || null;
  return label;
}

export function platformDisplayName(platform: GrowthPlatform): string {
  return platform === "x" ? "X" : "LinkedIn";
}
