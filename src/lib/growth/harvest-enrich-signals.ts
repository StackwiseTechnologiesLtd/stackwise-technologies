import {
  enrichProfileFromPage,
  profileUrlFromPost,
  type BrowserPage,
} from "@/lib/growth/profile-enrich";
import type { HarvestReporter } from "@/lib/growth/harvest-progress";
import type { GrowthPlatform, IngestSignalInput } from "@/lib/growth/types";

export async function enrichSignalsWithProfiles(
  page: BrowserPage,
  platform: GrowthPlatform,
  signals: IngestSignalInput[],
  report?: HarvestReporter,
): Promise<IngestSignalInput[]> {
  const out = signals.map((s) => ({ ...s }));
  const visited = new Set<string>();

  for (let i = 0; i < out.length; i++) {
    const signal = out[i];
    const url = profileUrlFromPost(
      platform,
      signal.authorProfileUrl,
      signal.authorHandle,
    );
    if (!url || visited.has(url)) continue;
    visited.add(url);

    await report?.(
      "extract",
      `Researching profile ${visited.size}: ${url.replace(/^https?:\/\//, "").slice(0, 55)}…`,
    );
    const profile = await enrichProfileFromPage(page, url, platform);
    if (!profile) continue;

    for (let j = 0; j < out.length; j++) {
      const otherUrl = profileUrlFromPost(
        platform,
        out[j].authorProfileUrl,
        out[j].authorHandle,
      );
      if (otherUrl !== url) continue;
      out[j] = {
        ...out[j],
        authorProfileUrl: url,
        roleTitle: out[j].roleTitle ?? profile.roleTitle ?? undefined,
        companyName: out[j].companyName ?? profile.companyName ?? undefined,
        profileContext: profile.summary,
      };
    }
  }

  return out;
}
