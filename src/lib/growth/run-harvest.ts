import {
  platformHome,
  sessionCookieName,
} from "@/lib/growth/connect-platform";
import { extractFeedSignals } from "@/lib/growth/harvest-extract";
import { isDevConnectRuntimeEnabled } from "@/lib/growth/dev-connect-runtime";
import {
  getHostedWorkerBrowser,
} from "@/lib/growth/hosted-connect";
import {
  ingestSignal,
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
      `Scoring lead ${ingested + 1} of ${signals.length}…`,
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

async function harvestWithPlaywright(
  platform: GrowthPlatform,
  cookies: Cookie[],
  userAgent: string | null,
  report?: HarvestReporter,
): Promise<IngestSignalInput[]> {
  await report?.("browser", "Starting browser (read-only)…");
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  try {
    const context = await browser.newContext({
      userAgent: userAgent ?? undefined,
    });
    await context.addCookies(cookies);
    const page = await context.newPage();
    await applyStealth(page);
    await report?.("feed", `Opening ${platform} home feed…`);
    await page.goto(platformHome[platform], {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    await humanDelay(3000, 6000);

    await report?.("verify", "Checking session is still valid…");
    const check = validatePageUrl(page.url());
    if (!check.ok) {
      await reportSessionHealth({
        platform,
        sessionStatus: "expired",
        lastError: check.error,
      });
      throw new Error(check.error ?? "Session not active");
    }

    const passes = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < passes; i++) {
      await report?.(
        "scroll",
        `Scrolling feed (${i + 1} of ${passes})…`,
      );
      const delta = 280 + Math.floor(Math.random() * 520);
      await page.mouse.wheel(0, delta);
      await humanDelay(1200, 3400);
    }
    await humanDelay(1500, 3500);
    await report?.("extract", "Reading posts from the page…");
    return await extractFeedSignals(page, platform);
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

  const canUseLocalPlaywright =
    isDevConnectRuntimeEnabled() || process.env.GROWTH_HARVEST_PLAYWRIGHT === "1";
  const hosted = await getHostedWorkerBrowser();

  let signals: IngestSignalInput[];
  if (canUseLocalPlaywright) {
    signals = await harvestWithPlaywright(
      platform,
      cookies,
      session.userAgent,
      report,
    );
  } else if (hosted) {
    signals = await harvestWithHostedBrowser(
      hosted.env,
      platform,
      cookies,
      session.userAgent,
      report,
    );
  } else {
    throw new Error(
      "Harvest is not available in this environment. Run locally with npm run dev or enable Browser Rendering in production.",
    );
  }

  await report?.(
    "extract",
    `Found ${signals.length} post${signals.length === 1 ? "" : "s"} on the feed.`,
  );

  if (signals.length === 0) {
    await report?.(
      "score",
      "No posts matched — X/LinkedIn may have changed layout or the feed was empty.",
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

async function harvestWithHostedBrowser(
  env: { BROWSER: import("@cloudflare/puppeteer").BrowserWorker },
  platform: GrowthPlatform,
  cookies: Cookie[],
  userAgent: string | null,
  report?: HarvestReporter,
): Promise<IngestSignalInput[]> {
  await report?.("browser", "Starting Cloudflare browser…");
  const puppeteer = await import("@cloudflare/puppeteer");
  const browser = await puppeteer.default.launch(env.BROWSER, {
    keep_alive: 120_000,
  });
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
    await report?.("feed", `Opening ${platform} home feed…`);
    await page.goto(platformHome[platform], {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    await sleep(3000);

    await report?.("verify", "Checking session…");
    const check = validatePageUrl(page.url());
    if (!check.ok) throw new Error(check.error);

    await report?.("extract", "Reading posts from the page…");
    // Puppeteer page doesn't use our Playwright extractors — use evaluate for minimal text
    const texts = await page.evaluate(() => {
      const nodes = document.querySelectorAll(
        'article[data-testid="tweet"], article[role="article"]',
      );
      return Array.from(nodes)
        .slice(0, 10)
        .map((n) => (n as HTMLElement).innerText?.trim() ?? "")
        .filter((t) => t.length > 20);
    });

    return texts.map((bodyText) => ({
      platform,
      authorName: bodyText.split("\n").find((l) => l.trim())?.slice(0, 120) ?? "Feed author",
      bodyText: bodyText.slice(0, 4000),
    }));
  } finally {
    await browser.disconnect();
  }
}
