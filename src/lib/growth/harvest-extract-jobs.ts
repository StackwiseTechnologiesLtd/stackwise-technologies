import type { IngestSignalInput } from "@/lib/growth/types";
import type { Page } from "playwright";

export type JobExtractDebug = {
  cards: number;
  parsed: number;
  skipped: number;
};

type RawJobCard = {
  title: string;
  company: string;
  location: string;
  href: string;
  snippet: string;
};

function absLinkedInUrl(href: string): string {
  if (!href) return "";
  if (href.startsWith("http")) return href.split("?")[0] ?? href;
  return `https://www.linkedin.com${href.startsWith("/") ? "" : "/"}${href}`.split(
    "?",
  )[0]!;
}

export function formatJobExtractDebug(debug: JobExtractDebug): string {
  return `Job cards seen ${debug.cards}, parsed ${debug.parsed}, skipped ${debug.skipped}`;
}

/**
 * Read LinkedIn Jobs search result cards from the current page.
 * Selectors are best-effort — LinkedIn markup changes often.
 */
export async function extractLinkedInJobCards(
  page: Page,
): Promise<{ signals: IngestSignalInput[]; debug: JobExtractDebug }> {
  const raw = await page.evaluate(() => {
    const out: RawJobCard[] = [];
    const seen = new Set<string>();

    const roots = Array.from(
      document.querySelectorAll(
        "li.jobs-search-results__list-item, li.scaffold-layout__list-item, div.job-card-container, li[data-occludable-job-id]",
      ),
    );

    for (const root of roots) {
      const link =
        (root.querySelector(
          'a[href*="/jobs/view/"]',
        ) as HTMLAnchorElement | null) ??
        (root.querySelector(
          "a.job-card-list__title--link, a.job-card-container__link",
        ) as HTMLAnchorElement | null);
      const href = link?.href?.trim() ?? "";
      if (!href || !href.includes("/jobs/view/")) continue;
      const key = href.split("?")[0] ?? href;
      if (seen.has(key)) continue;
      seen.add(key);

      const title =
        link?.innerText?.trim() ||
        (
          root.querySelector(
            ".job-card-list__title, .artdeco-entity-lockup__title, strong",
          ) as HTMLElement | null
        )?.innerText?.trim() ||
        "";

      const company =
        (
          root.querySelector(
            ".job-card-container__primary-description, .artdeco-entity-lockup__subtitle, .job-card-list__company-name",
          ) as HTMLElement | null
        )?.innerText?.trim() || "";

      const location =
        (
          root.querySelector(
            ".job-card-container__metadata-item, .job-card-list__location, .artdeco-entity-lockup__caption",
          ) as HTMLElement | null
        )?.innerText?.trim() || "";

      const snippet =
        (
          root.querySelector(
            ".job-card-list__insight, .job-card-container__footer-item",
          ) as HTMLElement | null
        )?.innerText?.trim() || "";

      if (!title || !company) continue;
      out.push({ title, company, location, href: key, snippet });
    }

    return out;
  });

  const debug: JobExtractDebug = {
    cards: raw.length,
    parsed: 0,
    skipped: 0,
  };

  const signals: IngestSignalInput[] = [];
  for (const job of raw) {
    const sourceUrl = absLinkedInUrl(job.href);
    if (!sourceUrl) {
      debug.skipped += 1;
      continue;
    }
    const locationBit = job.location ? ` Location: ${job.location}.` : "";
    const snippetBit = job.snippet ? ` ${job.snippet}` : "";
    const bodyText =
      `${job.title} at ${job.company}.${locationBit}${snippetBit}`.trim();

    signals.push({
      platform: "linkedin",
      leadSource: "linkedin_jobs",
      authorName: job.company,
      roleTitle: job.title,
      companyName: job.company,
      bodyText,
      sourceUrl,
      contextSummary: "linkedin-jobs",
      rawPayload: {
        applyUrl: sourceUrl,
        location: job.location || null,
      },
    });
    debug.parsed += 1;
  }

  return { signals, debug };
}
