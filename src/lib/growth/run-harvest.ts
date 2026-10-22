import {
  platformSessionCheck,
  sessionCookieName,
} from "@/lib/growth/connect-platform";
import {
  formatExtractDebug,
  rawPostsToSignals,
} from "@/lib/growth/harvest-extract";
import { growthHarvestExtractInPage } from "@/lib/growth/harvest-extract-in-page";
import { enrichSignalsWithProfiles } from "@/lib/growth/harvest-enrich-signals";
import {
  buildSearchQueriesFromIcp,
  dedupeSignals,
  platformSearchUrl,
} from "@/lib/growth/harvest-search";
import { detectAccountLabelOnPage } from "@/lib/growth/detect-account-label";
import type { GrowthSessionCookie } from "@/lib/growth/growth-session-cookie";
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
import type { BrowserPage } from "@/lib/growth/profile-enrich";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function normalizeCookies(cookies: unknown): GrowthSessionCookie[] {
  if (!Array.isArray(cookies)) return [];
  return cookies as GrowthSessionCookie[];
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
      `Scoring lead ${ingested + 1} of ${signals.length} (${signal.authorName.trim()})…`,
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

  const hosted = await getHostedWorkerBrowser();

  let signals: IngestSignalInput[];
  if (process.env.NODE_ENV === "development") {
    const { harvestSearchesWithPlaywright } = await import(
      "@/lib/growth/run-harvest-playwright"
    );
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
    await report?.("score", "Scoring against ICP and saving leads…");
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
  cookies: GrowthSessionCookie[],
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

    const hostedAccountLabel = await detectAccountLabelOnPage(
      page as BrowserPage,
      platform,
    );
    if (hostedAccountLabel) {
      await reportSessionHealth({
        platform,
        sessionStatus: "active",
        lastError: null,
        connectedAccountLabel: hostedAccountLabel,
      });
      await report?.("verify", `Session active as ${hostedAccountLabel}`);
    }

    for (let q = 0; q < queries.length; q++) {
      const query = queries[q];
      await report?.("search", `Search ${q + 1}/${queries.length}: “${query}”`);
      await page.goto(platformSearchUrl(platform, query), {
        waitUntil: "domcontentloaded",
        timeout: 120_000,
      });
      await sleep(3000);
      if (platform === "linkedin") {
        const scrollPasses = 4;
        for (let i = 0; i < scrollPasses; i++) {
          await report?.(
            "scroll",
            `Scrolling results (${i + 1} of ${scrollPasses})…`,
          );
          await page.evaluate(() => {
            window.scrollBy(0, 320 + Math.floor(Math.random() * 480));
          });
          await sleep(1200 + Math.floor(Math.random() * 2000));
        }
        await page.evaluate(() => {
          document
            .querySelectorAll(
              'button[data-testid="expandable-text-button"], button[aria-expanded="false"][aria-label*="more"]',
            )
            .forEach((btn) => {
              try {
                (btn as HTMLButtonElement).click();
              } catch {
                /* ignore */
              }
            });
        });
        await sleep(1200);
      }
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
          contextSummary: query,
        });
      }
      await sleep(2000);
    }

    const withProfilesHosted = await enrichSignalsWithProfiles(
      page as BrowserPage,
      platform,
      collected,
      report,
    );
    return dedupeSignals(withProfilesHosted);
  } finally {
    await browser.disconnect();
  }
}
