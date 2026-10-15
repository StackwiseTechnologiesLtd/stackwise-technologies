import type { GrowthPlatform, IcpConfig, IngestSignalInput } from "@/lib/growth/types";

const DEFAULT_MAX_QUERIES = 4;

export function buildSearchQueriesFromIcp(
  config: IcpConfig,
  maxQueries = DEFAULT_MAX_QUERIES,
): string[] {
  const intent = config.intentPhrases
    .map((p) => p.trim())
    .filter((p) => p.length >= 4);

  const queries: string[] = [];
  for (const phrase of intent) {
    if (queries.length >= maxQueries) break;
    if (!queries.includes(phrase)) queries.push(phrase);
  }

  if (queries.length < maxQueries) {
    for (const title of config.titleKeywords) {
      const combined = `${title} need developer`;
      if (queries.length >= maxQueries) break;
      if (!queries.some((q) => q.toLowerCase() === combined.toLowerCase())) {
        queries.push(combined);
      }
    }
  }

  return queries.slice(0, maxQueries);
}

export function platformSearchUrl(
  platform: GrowthPlatform,
  query: string,
): string {
  const q = encodeURIComponent(query);
  if (platform === "linkedin") {
    return `https://www.linkedin.com/search/results/content/?keywords=${q}`;
  }
  return `https://x.com/search?q=${q}&f=live`;
}

export function dedupeSignals(
  signals: IngestSignalInput[],
): IngestSignalInput[] {
  const seen = new Set<string>();
  const out: IngestSignalInput[] = [];
  for (const signal of signals) {
    const key =
      signal.sourceUrl?.trim() ||
      `${signal.platform}:${signal.bodyText.slice(0, 240)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(signal);
  }
  return out;
}
