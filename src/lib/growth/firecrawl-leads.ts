import { firecrawlScrapeMarkdown, firecrawlSearch } from "@/lib/integrations/firecrawl-client";
import { getIcpConfig, ingestSignal } from "@/lib/growth/repository";
import { scoreLead } from "@/lib/growth/scoring";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const EMAIL_BLOCKLIST =
  /example\.|noreply|no-reply|donotreply|sentry|wixpress|github\.com|firebase|google\.com|facebook\.com/i;

export type FirecrawlDiscoverResult = {
  query: string;
  pagesScanned: number;
  emailsFound: number;
  leadsCreated: number;
  leadsSkipped: number;
  errors: string[];
};

function extractEmails(text: string): string[] {
  const found = text.match(EMAIL_RE) ?? [];
  const uniq = new Set<string>();
  for (const raw of found) {
    const email = raw.toLowerCase();
    if (EMAIL_BLOCKLIST.test(email)) continue;
    if (email.endsWith(".png") || email.endsWith(".jpg")) continue;
    uniq.add(email);
  }
  return [...uniq];
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "there";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return "there";
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function companyFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const segment = host.split(".")[0];
    if (!segment || segment.length < 2) return null;
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  } catch {
    return null;
  }
}

export async function discoverFirecrawlLeads(options: {
  query: string;
  limit?: number;
}): Promise<FirecrawlDiscoverResult> {
  const query = options.query.trim();
  if (!query) throw new Error("Search query is required");

  const limit = Math.min(20, Math.max(1, options.limit ?? 10));
  const hits = await firecrawlSearch(query, { limit, scrapeMarkdown: true });
  const config = await getIcpConfig();

  const summary: FirecrawlDiscoverResult = {
    query,
    pagesScanned: 0,
    emailsFound: 0,
    leadsCreated: 0,
    leadsSkipped: 0,
    errors: [],
  };

  const seenEmails = new Set<string>();

  for (const hit of hits) {
    summary.pagesScanned += 1;
    let text = [hit.title, hit.description, hit.markdown].filter(Boolean).join("\n\n");
    if (!text.trim() && hit.url) {
      try {
        text = await firecrawlScrapeMarkdown(hit.url);
      } catch (error) {
        summary.errors.push(
          `${hit.url}: ${error instanceof Error ? error.message : "scrape failed"}`,
        );
        continue;
      }
    }

    const emails = extractEmails(text);
    summary.emailsFound += emails.length;

    for (const email of emails) {
      if (seenEmails.has(email)) {
        summary.leadsSkipped += 1;
        continue;
      }
      seenEmails.add(email);

      const authorName = hit.title?.slice(0, 120) || nameFromEmail(email);
      const companyName = companyFromUrl(hit.url);
      const bodyText = text.slice(0, 8000) || `Discovered via Firecrawl search: ${query}`;
      const scored = scoreLead({
        roleTitle: null,
        companyName,
        bodyText,
        config,
      });

      try {
        await ingestSignal({
          platform: "linkedin",
          leadSource: "firecrawl",
          sourceUrl: hit.url,
          authorName,
          authorProfileUrl: hit.url,
          companyName: companyName ?? undefined,
          bodyText,
          contextSummary: `firecrawl search: ${query}`,
          email,
          rawPayload: {
            firecrawl: true,
            query,
            compositeScore: scored.compositeScore,
          },
        });
        summary.leadsCreated += 1;
      } catch (error) {
        summary.leadsSkipped += 1;
        summary.errors.push(
          `${email}: ${error instanceof Error ? error.message : "ingest failed"}`,
        );
      }
    }
  }

  return summary;
}
