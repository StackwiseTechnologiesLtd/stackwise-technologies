import {
  platformSessionCheck,
  sessionCookieName,
} from "@/lib/growth/connect-platform";
import {
  extractFeedSignals,
  formatExtractDebug,
  rawPostsToSignals,
} from "@/lib/growth/harvest-extract";
import { growthHarvestExtractInPage } from "@/lib/growth/harvest-extract-in-page";
import {
  buildSearchQueriesFromIcp,
  dedupeSignals,
  platformSearchUrl,
} from "@/lib/growth/harvest-search";
import {
  enrichProfileFromPage,
  profileUrlFromPost,
  type BrowserPage,
} from "@/lib/growth/profile-enrich";
import { isDevConnectRuntimeEnabled } from "@/lib/growth/dev-connect-runtime";
import {
  getHostedWorkerBrowser,
} from "@/lib/growth/hosted-connect";
import {
  ingestSignal,
  getIcpConfig,
  getPlatformSession,
  reportSessionHealth,
  touchCredentialSync,
} from "@/lib/growth/repository";
import type { HarvestReporter } from "@/lib/growth/harvest-progress";
import type { GrowthPlatform, IngestSignalInput } from "@/lib/growth/types";
import type { Cookie, Page } from "playwright";

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

function normalizeCookies(cookies: unknown): Cookie[] {
  if (!Array.isArray(cookies)) return [];
  return cookies as Cookie[];
}

async function enrichSignalsWithProfiles(
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

async function ingestSignals(
  signals: IngestSignalInput[],
  report?: HarvestReporter,
): Promise<number> {
  let ingested = 0;
  for (let i = 0; i < signals.length; i++) {
    const signal = signals[i];
    if (!signal.authorName?.trim() || !signal.bodyText?.trim()) continue;
    await report?.(
      "score",
      `Scoring & drafting ${ingested + 1} of ${signals.length} (${signal.authorName.trim()})…`,
    );
    await ingestSignal({
      ...signal,
      authorName: signal.authorName.trim(),
      bodyText: signal.bodyText.trim(),
    });
    ingested += 1;
  }
  return ingested;
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

async function harvestSearchesWithPlaywright(
  platform: GrowthPlatform,
  cookies: Cookie[],
  userAgent: string | null,
  queries: string[],
  report?: HarvestReporter,
): Promise<IngestSignalInput[]> {
  await report?.("browser", "Starting browser (read-only)…");
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    headless: true,
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

      await scrollResults(page, 2 + Math.floor(Math.random() * 2), report);
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
          contextSummary: `ICP search: ${query}`,
        });
      }
      await humanDelay(1500, 3000);
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

export async function runPlatformHarvest(
  platform: GrowthPlatform,
  report?: HarvestReporter,
): Promise<{ captured: number; ingested: number }> {
  await report?.("session", "Loading encrypted session from database…");
  const session = await getPlatformSession(platform);
  if (!session?.cookies) {
    throw new Error(`Connect ${platform} before harvesting.`);
  }

  const cookies = normalizeCookies(session.cookies);
  const cookieName = sessionCookieName[platform];
  if (!cookies.some((c) => c.name === cookieName && c.value)) {
    throw new Error(`Stored session missing ${cookieName}. Reconnect ${platform}.`);
  }

  await report?.("icp", "Loading ICP search phrases from settings…");
  const icp = await getIcpConfig();
  const queries = buildSearchQueriesFromIcp(icp);
  if (queries.length === 0) {
    throw new Error(
      "No search phrases in ICP settings. Add intent phrases under Growth → Settings.",
    );
  }
  await report?.(
    "icp",
    `Queries: ${queries.map((q) => `“${q}”`).join(", ")}`,
  );

  const canUseLocalPlaywright =
    isDevConnectRuntimeEnabled() || process.env.GROWTH_HARVEST_PLAYWRIGHT === "1";
  const hosted = await getHostedWorkerBrowser();

  let signals: IngestSignalInput[];
  if (canUseLocalPlaywright) {
    signals = await harvestSearchesWithPlaywright(
      platform,
      cookies,
      session.userAgent,
      queries,
      report,
    );
  } else if (hosted) {
    signals = await harvestSearchesWithHostedBrowser(
      hosted.env,
      platform,
      cookies,
      session.userAgent,
      queries,
      report,
    );
  } else {
    throw new Error(
      "Harvest is not available in this environment. Run locally with npm run dev or enable Browser Rendering in production.",
    );
  }

  await report?.(
    "extract",
    `Found ${signals.length} unique post${signals.length === 1 ? "" : "s"} across searches.`,
  );

  if (signals.length === 0) {
    await report?.(
      "score",
      "No posts matched — try different intent phrases in ICP settings or reconnect.",
    );
  } else {
    await report?.("score", "Scoring against ICP and drafting replies…");
  }

  const ingested = await ingestSignals(signals, report);
  await report?.("sync", "Updating last sync time…");
  await touchCredentialSync(platform);
  await reportSessionHealth({
    platform,
    sessionStatus: "active",
    lastError: null,
  });
  await report?.(
    "done",
    ingested > 0
      ? `Done — ${ingested} new lead${ingested === 1 ? "" : "s"} in inbox.`
      : "Done — no new leads created.",
  );

  return { captured: signals.length, ingested };
}

async function harvestSearchesWithHostedBrowser(
  env: { BROWSER: import("@cloudflare/puppeteer").BrowserWorker },
  platform: GrowthPlatform,
  cookies: Cookie[],
  userAgent: string | null,
  queries: string[],
  report?: HarvestReporter,
): Promise<IngestSignalInput[]> {
  await report?.("browser", "Starting Cloudflare browser…");
  const puppeteer = await import("@cloudflare/puppeteer");
  const browser = await puppeteer.default.launch(env.BROWSER, {
    keep_alive: 300_000,
  });
  const collected: IngestSignalInput[] = [];

  try {
    const page = await browser.newPage();
    if (userAgent) await page.setUserAgent(userAgent);
    for (const cookie of cookies) {
      await page.setCookie({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path ?? "/",
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite as "Strict" | "Lax" | "None" | undefined,
      });
    }

    await page.goto(platformSessionCheck[platform], {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    await sleep(2000);
    const check = validatePageUrl(page.url());
    if (!check.ok) throw new Error(check.error);

    for (let q = 0; q < queries.length; q++) {
      const query = queries[q];
      await report?.("search", `Search ${q + 1}/${queries.length}: “${query}”`);
      await page.goto(platformSearchUrl(platform, query), {
        waitUntil: "domcontentloaded",
        timeout: 120_000,
      });
      await sleep(3000);
      await report?.("extract", `Reading posts for “${query}”…`);

      const { posts, debug } = await page.evaluate(
        growthHarvestExtractInPage,
        platform,
      );
      await report?.("extract", formatExtractDebug(debug));
      const batch = rawPostsToSignals(platform, posts);
      for (const signal of batch) {
        collected.push({
          ...signal,
          contextSummary: `ICP search: ${query}`,
        });
      }
      await sleep(2000);
    }

    const withProfiles = await enrichSignalsWithProfiles(
      page as BrowserPage,
      platform,
      collected,
      report,
    );
    return dedupeSignals(withProfiles);
  } finally {
    await browser.disconnect();
  }
}
