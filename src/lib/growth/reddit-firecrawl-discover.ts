import {
  discoverFirecrawlLeads,
  type FirecrawlDiscoverResult,
} from "@/lib/growth/firecrawl-leads";

/** Default Reddit searches for Stackwise services (emails only — no outreach). */
export const REDDIT_DISCOVER_QUERIES = [
  "need developer MVP startup",
  "hire web developer OR full stack",
  "website redesign small business",
  "UI UX design help landing page",
  "loyalty program app software",
  "looking for agency build app",
] as const;

export type RedditDiscoverBatchResult = {
  runs: FirecrawlDiscoverResult[];
  totals: {
    pagesScanned: number;
    emailsFound: number;
    leadsCreated: number;
    leadsSkipped: number;
    errors: number;
  };
};

export async function discoverRedditFirecrawlBatch(options?: {
  queries?: string[];
  limitPerQuery?: number;
}): Promise<RedditDiscoverBatchResult> {
  const queries = options?.queries?.length
    ? options.queries
    : [...REDDIT_DISCOVER_QUERIES];
  const limit = Math.min(20, Math.max(1, options?.limitPerQuery ?? 12));
  const runs: FirecrawlDiscoverResult[] = [];

  for (const q of queries) {
    runs.push(
      await discoverFirecrawlLeads({
        query: q,
        limit,
        redditOnly: true,
      }),
    );
  }

  const totals = {
    pagesScanned: 0,
    emailsFound: 0,
    leadsCreated: 0,
    leadsSkipped: 0,
    errors: 0,
  };
  for (const run of runs) {
    totals.pagesScanned += run.pagesScanned;
    totals.emailsFound += run.emailsFound;
    totals.leadsCreated += run.leadsCreated;
    totals.leadsSkipped += run.leadsSkipped;
    totals.errors += run.errors.length;
  }

  return { runs, totals };
}
