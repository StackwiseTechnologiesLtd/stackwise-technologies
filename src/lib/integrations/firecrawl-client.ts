export function firecrawlApiBase(): string {
  return (process.env.FIRECRAWL_API_BASE ?? "http://localhost:3002").replace(/\/$/, "");
}

function authHeaders(): Record<string, string> {
  const key = process.env.FIRECRAWL_API_KEY?.trim();
  if (!key) return {};
  return { Authorization: `Bearer ${key}` };
}

export type FirecrawlSearchHit = {
  url: string;
  title?: string;
  description?: string;
  markdown?: string;
};

export async function firecrawlHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${firecrawlApiBase()}/v0/health/readiness`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Web search + optional markdown scrape via self-hosted Firecrawl. */
export async function firecrawlSearch(
  query: string,
  options?: { limit?: number; scrapeMarkdown?: boolean },
): Promise<FirecrawlSearchHit[]> {
  const limit = Math.min(20, Math.max(1, options?.limit ?? 10));
  const res = await fetch(`${firecrawlApiBase()}/v1/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      query,
      limit,
      scrapeOptions: options?.scrapeMarkdown !== false ? { formats: ["markdown"] } : undefined,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Firecrawl search failed (${res.status}): ${text.slice(0, 400)}. Is local Firecrawl up? npm run integrations:firecrawl:up`,
    );
  }

  const json = (await res.json()) as {
    success?: boolean;
    data?: Array<Record<string, unknown>>;
    web?: Array<Record<string, unknown>>;
  };

  const rows = json.data ?? json.web ?? [];
  const hits: FirecrawlSearchHit[] = [];

  for (const row of rows) {
    const url = String(row.url ?? row.link ?? "").trim();
    if (!url) continue;
    hits.push({
      url,
      title: row.title ? String(row.title) : undefined,
      description: row.description ? String(row.description) : undefined,
      markdown:
        typeof row.markdown === "string"
          ? row.markdown
          : typeof (row as { markdown?: string }).markdown === "string"
            ? (row as { markdown: string }).markdown
            : undefined,
    });
  }

  return hits;
}

export async function firecrawlScrapeMarkdown(url: string): Promise<string> {
  const res = await fetch(`${firecrawlApiBase()}/v1/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ url, formats: ["markdown"], timeout: 60000 }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) {
    throw new Error(`Firecrawl scrape failed (${res.status}) for ${url}`);
  }
  const json = (await res.json()) as { data?: { markdown?: string }; markdown?: string };
  return json.data?.markdown ?? json.markdown ?? "";
}
