import { platformSessionCheck, platformHome } from "@/lib/growth/connect-platform";
import { detectAccountLabelOnPage } from "@/lib/growth/detect-account-label";
import {
  extractFeedSignals,
  formatExtractDebug,
} from "@/lib/growth/harvest-extract";
import { enrichSignalsWithProfiles } from "@/lib/growth/harvest-enrich-signals";
import { dedupeSignals, platformSearchUrl } from "@/lib/growth/harvest-search";
import type { GrowthSessionCookie } from "@/lib/growth/growth-session-cookie";
import { loadPlaywrightModule } from "@/lib/growth/playwright-loader";
import type { BrowserPage } from "@/lib/growth/profile-enrich";
import { reportSessionHealth } from "@/lib/growth/repository";
import type { HarvestReporter } from "@/lib/growth/harvest-progress";
import type { GrowthPlatform, IngestSignalInput } from "@/lib/growth/types";
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

async function scrollResults(page: Page, passes: number, report?: HarvestReporter) {
  for (let i = 0; i < passes; i++) {
    await report?.("scroll", `Scrolling results (${i + 1} of ${passes})…`);
    const delta = 280 + Math.floor(Math.random() * 520);
    await page.mouse.wheel(0, delta);
    await humanDelay(1200, 3400);
  }
  await humanDelay(1500, 3500);
}

export async function harvestSearchesWithPlaywright(
  platform: GrowthPlatform,
  cookies: GrowthSessionCookie[],
  userAgent: string | null,
  queries: string[],
  report?: HarvestReporter,
): Promise<IngestSignalInput[]> {
  await report?.("browser", "Starting browser (read-only)…");
  const { chromium } = await loadPlaywrightModule();
  const forceHeadless = process.env.GROWTH_HARVEST_HEADLESS === "1";
  const forceHeaded = process.env.GROWTH_HARVEST_HEADED === "1";
  const harvestHeaded =
    forceHeaded || (!forceHeadless && platform === "linkedin");
  if (harvestHeaded) {
    await report?.(
      "browser",
      "Using visible browser (LinkedIn often blocks headless search). Set GROWTH_HARVEST_HEADLESS=1 to force headless.",
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

    await report?.("verify", "Checking session…");
    await page.goto(platformSessionCheck[platform], {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    await humanDelay(2000, 4000);
    const sessionCheck = validatePageUrl(page.url());
    if (!sessionCheck.ok) {
      await reportSessionHealth({
        platform,
        sessionStatus: "expired",
        lastError: sessionCheck.error,
      });
      throw new Error(sessionCheck.error ?? "Session not active");
    }

    const accountLabel = await detectAccountLabelOnPage(page, platform);
    if (accountLabel) {
      await reportSessionHealth({
        platform,
        sessionStatus: "active",
        lastError: null,
        connectedAccountLabel: accountLabel,
      });
      await report?.("verify", `Session active as ${accountLabel}`);
    }

    await report?.(
      "search",
      `Running ${queries.length} ICP search${queries.length === 1 ? "" : "es"} on ${platform}…`,
    );

    for (let q = 0; q < queries.length; q++) {
      const query = queries[q];
      await report?.(
        "search",
        `Search ${q + 1}/${queries.length}: “${query}”`,
      );
      await page.goto(platformSearchUrl(platform, query), {
        waitUntil: "domcontentloaded",
        timeout: 120_000,
      });
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
      await humanDelay(2500, 5000);

      const urlCheck = validatePageUrl(page.url());
      if (!urlCheck.ok) {
        throw new Error(urlCheck.error ?? "Session lost during search");
      }

      const scrollPasses =
        platform === "linkedin" ? 4 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 2);
      await scrollResults(page, scrollPasses, report);
      await report?.("extract", `Reading posts for “${query}”…`);
      const { signals: batch, debug } = await extractFeedSignals(page, platform);
      await report?.("extract", formatExtractDebug(debug));
      if (debug.parsed === 0) {
        const hint = await page.title();
        await report?.(
          "extract",
          `Page title: “${hint.slice(0, 80)}” — if this is a login or error screen, reconnect ${platform}.`,
        );
      }
      for (const signal of batch) {
        collected.push({
          ...signal,
          contextSummary: query,
        });
      }
      await humanDelay(1500, 3000);
    }

    if (collected.length === 0 && platform === "linkedin") {
      await report?.(
        "search",
        "No posts from ICP search — scanning your LinkedIn home feed…",
      );
      await page.goto(platformHome.linkedin, {
        waitUntil: "domcontentloaded",
        timeout: 120_000,
      });
      await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(
        () => undefined,
      );
      await humanDelay(3000, 5000);
      await scrollResults(page, 6, report);
      await report?.("extract", "Reading home feed…");
      const { signals: feedBatch, debug: feedDebug } = await extractFeedSignals(
        page,
        platform,
      );
      await report?.("extract", formatExtractDebug(feedDebug));
      for (const signal of feedBatch) {
        collected.push({
          ...signal,
          contextSummary: "linkedin-feed",
        });
      }
    }

    const withProfiles = await enrichSignalsWithProfiles(
      page as BrowserPage,
      platform,
      collected,
      report,
    );
    return dedupeSignals(withProfiles);
  } finally {
    await browser.close();
  }
}
