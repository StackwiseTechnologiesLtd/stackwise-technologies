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

/** LinkedIn Jobs UI (2025+) duplicates the title in card text — collapse that. */
function dedupeRepeatedTitle(raw: string): string {
  const words = raw.trim();
  if (words.length < 8) return words;
  for (let len = Math.floor(words.length / 2); len >= 4; len--) {
    const a = words.slice(0, len).trim();
    const rest = words.slice(len).trimStart();
    if (a.length >= 4 && rest.startsWith(a)) return a;
  }
  return words;
}

/**
 * Parse card innerText from the new Jobs search-results UI.
 * Example: "Full-Stack Developer Statkraft Düsseldorf (Hybrid) Posted 3 weeks ago · Easy Apply"
 */
export function parseLinkedInJobCardText(text: string): {
  title: string;
  company: string;
  location: string;
  snippet: string;
} {
  let t = text.replace(/\s+/g, " ").trim();
  const snippetBits: string[] = [];
  if (/Easy Apply/i.test(t)) snippetBits.push("Easy Apply");
  if (/Verified job/i.test(t)) snippetBits.push("Verified");

  t = t
    .replace(/\s*·\s*Easy Apply/gi, "")
    .replace(/\s+Easy Apply$/gi, "")
    .replace(/\s*Actively reviewing applicants/gi, "")
    .replace(/\s*Viewed/gi, "")
    .replace(/\s*Posted\s+\d+\s+\w+(?:\s+ago)?/gi, "")
    .replace(/\s+\d+\s+(?:day|days|week|weeks|month|months)\s+ago/gi, "")
    .replace(/\s*\(Verified job\)/gi, "")
    .trim();

  const locMatch = t.match(
    /^(.*)\s+((?:Greater\s+)?[^()]+?\((?:Remote|Hybrid|On-?site)[^)]*\))(?:\s+.*)?$/i,
  );
  if (locMatch) {
    const beforeLoc = (locMatch[1] ?? "").trim();
    const location = (locMatch[2] ?? "").trim();
    const title = dedupeRepeatedTitle(beforeLoc);
    let company = "Unknown";
    if (title && beforeLoc.startsWith(title)) {
      company = beforeLoc.slice(title.length).trim();
      // Card text often repeats the title twice before the company.
      if (company.startsWith(title)) {
        company = company.slice(title.length).trim();
      }
      company = company || "Unknown";
    }
    // If dedupe failed and company empty, split last 1–4 tokens as company
    if (company === "Unknown" || !company) {
      const parts = beforeLoc.split(/\s+/);
      if (parts.length >= 2) {
        company = parts.slice(-2).join(" ");
        return {
          title: parts.slice(0, -2).join(" ").slice(0, 160),
          company,
          location,
          snippet: snippetBits.join(" · "),
        };
      }
    }
    return {
      title: title.slice(0, 160),
      company,
      location,
      snippet: snippetBits.join(" · "),
    };
  }

  // Fallback: title only
  return {
    title: dedupeRepeatedTitle(t).slice(0, 160),
    company: "Unknown",
    location: "",
    snippet: snippetBits.join(" · "),
  };
}
/**
 * Read LinkedIn Jobs search result cards from the current page.
 * Selectors target the 2025+ search-results UI (`componentkey=job-card-component-ref-*`).
 */
export async function extractLinkedInJobCards(
  page: Page,
): Promise<{ signals: IngestSignalInput[]; debug: JobExtractDebug }> {
  const raw = await page.evaluate(() => {
    const out: RawJobCard[] = [];
    const seen = new Set<string>();

    const roots = Array.from(
      document.querySelectorAll(
        'div[role="button"][componentkey^="job-card-component-ref-"], li.jobs-search-results__list-item, li.scaffold-layout__list-item, div.job-card-container, li[data-occludable-job-id]',
      ),
    );

    for (const root of roots) {
      const componentKey =
        root.getAttribute("componentkey") ||
        root
          .querySelector("[componentkey^='job-card-component-ref-']")
          ?.getAttribute("componentkey") ||
        "";
      const idMatch = componentKey.match(/job-card-component-ref-(\d+)/);
      const link =
        (root.querySelector(
          'a[href*="/jobs/view/"]',
        ) as HTMLAnchorElement | null) ?? null;
      const hrefFromLink = link?.href?.trim() ?? "";
      const href = idMatch
        ? `https://www.linkedin.com/jobs/view/${idMatch[1]}`
        : hrefFromLink;
      if (!href || !href.includes("/jobs/view/")) continue;
      const key = href.split("?")[0] ?? href;
      if (seen.has(key)) continue;
      seen.add(key);

      const text = (root as HTMLElement).innerText?.trim() || "";
      out.push({
        title: "",
        company: "",
        location: "",
        href: key,
        snippet: text,
      });
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
    const parsed = parseLinkedInJobCardText(job.snippet);
    if (!parsed.title || parsed.title.length < 3) {
      debug.skipped += 1;
      continue;
    }
    const company =
      parsed.company && parsed.company !== "Unknown"
        ? parsed.company
        : "Unknown company";
    const locationBit = parsed.location ? ` Location: ${parsed.location}.` : "";
    const snippetBit = parsed.snippet ? ` ${parsed.snippet}` : "";
    const bodyText =
      `${parsed.title} at ${company}.${locationBit}${snippetBit}`.trim();

    signals.push({
      platform: "linkedin",
      leadSource: "linkedin_jobs",
      authorName: company,
      roleTitle: parsed.title,
      companyName: company,
      bodyText,
      sourceUrl,
      contextSummary: "linkedin-jobs",
      rawPayload: {
        applyUrl: sourceUrl,
        location: parsed.location || null,
        easyApply: /easy apply/i.test(parsed.snippet),
      },
    });
    debug.parsed += 1;
  }

  return { signals, debug };
}
