import { platformSessionCheck } from "@/lib/growth/connect-platform";
import { detectAccountLabelOnPage } from "@/lib/growth/detect-account-label";
import {
  extractLinkedInJobCards,
  formatJobExtractDebug,
} from "@/lib/growth/harvest-extract-jobs";
import { evaluateJobIngestCandidate } from "@/lib/growth/job-ingest-quality";
import type { HarvestReporter } from "@/lib/growth/harvest-progress";
import {
  buildJobSearchQueriesFromIcp,
  dedupeSignals,
  linkedinJobsSearchUrl,
} from "@/lib/growth/harvest-search";
import type { GrowthSessionCookie } from "@/lib/growth/growth-session-cookie";
import { loadPlaywrightModule } from "@/lib/growth/playwright-loader";
import {
  getIcpConfig,
  getPlatformSession,
  ingestSignal,
  reportSessionHealth,
  signalAlreadyIngested,
  touchCredentialSync,
} from "@/lib/growth/repository";
import type { IngestSignalInput } from "@/lib/growth/types";
import type { Page } from "playwright";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function humanDelay(minMs = 800, maxMs = 2800) {
  const span = Math.max(0, maxMs - minMs);
  return sleep(minMs + Math.floor(Math.random() * (span + 1)));
}

async function applyStealth(page: Page) {
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    // @ts-expect-error page context
    window.chrome = { runtime: {} };
  });
}

function validatePageUrl(url: string): { ok: boolean; error?: string } {
  if (url.includes("/login") || url.includes("/i/flow/login")) {
    return { ok: false, error: "Session expired — connect again" };
  }
  if (url.includes("checkpoint") || url.includes("challenge")) {
    return { ok: false, error: "Verification required" };
  }
  return { ok: true };
}

async function scrollResults(
  page: Page,
  passes: number,
  report?: HarvestReporter,
) {
  for (let i = 0; i < passes; i++) {
    await report?.("scroll", `Scrolling job results (${i + 1} of ${passes})…`);
    const delta = 280 + Math.floor(Math.random() * 520);
    await page.mouse.wheel(0, delta);
    await humanDelay(1200, 3400);
  }
  await humanDelay(1500, 3500);
}

function normalizeCookies(cookies: unknown): GrowthSessionCookie[] {
  if (!Array.isArray(cookies)) return [];
  return cookies as GrowthSessionCookie[];
}

async function harvestJobsWithPlaywright(
  cookies: GrowthSessionCookie[],
  userAgent: string | null,
  queries: string[],
  report?: HarvestReporter,
): Promise<IngestSignalInput[]> {
  await report?.("browser", "Starting browser for LinkedIn Jobs…");
  const { chromium } = await loadPlaywrightModule();
  const forceHeadless = process.env.GROWTH_HARVEST_HEADLESS === "1";
  const forceHeaded = process.env.GROWTH_HARVEST_HEADED === "1";
  const harvestHeaded = forceHeaded || !forceHeadless;
  if (harvestHeaded) {
    await report?.(
      "browser",
      "Using visible browser (LinkedIn often blocks headless). Set GROWTH_HARVEST_HEADLESS=1 to force headless.",
    );
  }
  const browser = await chromium.launch({
    headless: !harvestHeaded,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const collected: IngestSignalInput[] = [];

  try {
    const context = await browser.newContext({
      userAgent: userAgent ?? undefined,
    });
    await context.addCookies(cookies);
    const page = await context.newPage();
    await applyStealth(page);

    await report?.("verify", "Checking LinkedIn session…");
    await page.goto(platformSessionCheck.linkedin, {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    await humanDelay(2000, 4000);
    const sessionCheck = validatePageUrl(page.url());
    if (!sessionCheck.ok) {
      await reportSessionHealth({
        platform: "linkedin",
        sessionStatus: "expired",
        lastError: sessionCheck.error,
      });
      throw new Error(sessionCheck.error ?? "Session not active");
    }

    const accountLabel = await detectAccountLabelOnPage(page, "linkedin");
    if (accountLabel) {
      await reportSessionHealth({
        platform: "linkedin",
        sessionStatus: "active",
        lastError: null,
        connectedAccountLabel: accountLabel,
      });
      await report?.("verify", `Session active as ${accountLabel}`);
    }

    await report?.(
      "search",
      `Running ${queries.length} remote job search${queries.length === 1 ? "" : "es"}…`,
    );

    for (let q = 0; q < queries.length; q++) {
      const query = queries[q];
      await report?.(
        "search",
        `Jobs search ${q + 1}/${queries.length}: “${query}” (remote)`,
      );
      await page.goto(linkedinJobsSearchUrl(query, { remote: true }), {
        waitUntil: "domcontentloaded",
        timeout: 120_000,
      });
      await page
        .waitForLoadState("networkidle", { timeout: 15_000 })
        .catch(() => undefined);
      await humanDelay(2500, 5000);

      const urlCheck = validatePageUrl(page.url());
      if (!urlCheck.ok) {
        throw new Error(urlCheck.error ?? "Session lost during jobs search");
      }

      await scrollResults(page, 3 + Math.floor(Math.random() * 2), report);
      await report?.("extract", `Reading job cards for “${query}”…`);
      const { signals: batch, debug } = await extractLinkedInJobCards(page);
      await report?.("extract", formatJobExtractDebug(debug));
      for (const signal of batch) {
        collected.push({
          ...signal,
          contextSummary: query,
        });
      }
      await humanDelay(1500, 3000);
    }

    return dedupeSignals(collected);
  } finally {
    await browser.close();
  }
}

export async function runLinkedInJobsHarvest(
  report?: HarvestReporter,
): Promise<{ captured: number; ingested: number }> {
  const session = await getPlatformSession("linkedin");
  const cookies = normalizeCookies(session?.cookies);
  if (!session || cookies.length === 0) {
    throw new Error("Connect LinkedIn first (Growth → Connect)");
  }

  const icp = await getIcpConfig();
  const queries = buildJobSearchQueriesFromIcp(icp);
  await report?.(
    "session",
    `ICP job titles → ${queries.map((q) => `“${q}”`).join(", ")}`,
  );

  const signals = await harvestJobsWithPlaywright(
    cookies,
    session.userAgent,
    queries,
    report,
  );

  await report?.(
    "score",
    `Captured ${signals.length} job listing${signals.length === 1 ? "" : "s"} — scoring…`,
  );

  let ingested = 0;
  let skipped = 0;
  for (const signal of signals) {
    const verdict = evaluateJobIngestCandidate(signal, icp);
    if (!verdict.ok) {
      skipped += 1;
      await report?.(
        "score",
        `Skipped (${signal.roleTitle ?? signal.authorName}): ${verdict.reason}`,
      );
      continue;
    }
    if (await signalAlreadyIngested(signal)) {
      skipped += 1;
      await report?.(
        "score",
        `Skipped duplicate job ${signal.sourceUrl ?? signal.roleTitle}`,
      );
      continue;
    }
    await ingestSignal({
      ...signal,
      leadSource: "linkedin_jobs",
      authorName: signal.authorName.trim(),
      bodyText: signal.bodyText.trim(),
    });
    ingested += 1;
    await report?.(
      "score",
      `Saved ${signal.roleTitle} @ ${signal.companyName} (${verdict.score.compositeScore}% fit)`,
    );
  }

  if (skipped > 0) {
    await report?.(
      "score",
      `Filtered out ${skipped} low-fit, stale, or duplicate job${skipped === 1 ? "" : "s"}.`,
    );
  }

  await touchCredentialSync("linkedin");
  return { captured: signals.length, ingested };
}
