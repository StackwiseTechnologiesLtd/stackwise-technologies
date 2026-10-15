import puppeteer, { type BrowserWorker } from "@cloudflare/puppeteer";
import {
  platformHome,
  platformLogin,
  sessionCookieName,
} from "@/lib/growth/connect-platform";
import {
  reportSessionHealth,
  savePlatformCredentials,
} from "@/lib/growth/repository";
import type { GrowthPlatform } from "@/lib/growth/types";
import {
  getConnectBrowserSession,
  insertConnectBrowserSession,
  updateConnectBrowserSession,
} from "@/lib/growth/connect-sessions-repository";

type BrowserBindingEnv = { BROWSER: BrowserWorker };

const KEEP_ALIVE_MS = 600_000;
const VIEWPORT = { width: 1100, height: 720 };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withPage(
  env: BrowserBindingEnv,
  puppeteerSessionId: string,
): Promise<{ browser: Awaited<ReturnType<typeof puppeteer.connect>>; page: import("@cloudflare/puppeteer").Page }> {
  const browser = await puppeteer.connect(env.BROWSER, puppeteerSessionId);
  const pages = await browser.pages();
  const page = pages[0] ?? (await browser.newPage());
  return { browser, page };
}

async function applyStealth(page: import("@cloudflare/puppeteer").Page) {
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
  });
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    // @ts-expect-error injected in browser
    window.chrome = { runtime: {} };
  });
}

export async function startHostedConnectSession(
  env: BrowserBindingEnv,
  platform: GrowthPlatform,
  ctx: { waitUntil: (promise: Promise<unknown>) => void },
): Promise<{ sessionId: string }> {
  const browser = await puppeteer.launch(env.BROWSER, {
    keep_alive: KEEP_ALIVE_MS,
  });
  const puppeteerSessionId = browser.sessionId();
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await applyStealth(page);

  const sessionId = crypto.randomUUID();
  await insertConnectBrowserSession({
    id: sessionId,
    platform,
    puppeteerSessionId,
    status: "login",
  });

  await page.goto(platformLogin[platform], {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });

  ctx.waitUntil(
    watchHostedLogin(env, sessionId, platform, puppeteerSessionId).finally(
      () => browser.disconnect().catch(() => undefined),
    ),
  );

  return { sessionId };
}

async function watchHostedLogin(
  env: BrowserBindingEnv,
  sessionId: string,
  platform: GrowthPlatform,
  puppeteerSessionId: string,
) {
  const cookieName = sessionCookieName[platform];
  const deadline = Date.now() + KEEP_ALIVE_MS - 30_000;

  try {
    while (Date.now() < deadline) {
      const row = await getConnectBrowserSession(sessionId);
      if (!row || row.status === "complete" || row.status === "error") {
        return;
      }

      const { browser, page } = await withPage(env, puppeteerSessionId);
      try {
        const cookies = await page.cookies();
        const hasSession = cookies.some(
          (c) => c.name === cookieName && Boolean(c.value),
        );
        if (!hasSession) {
          await sleep(2000);
          continue;
        }

        await updateConnectBrowserSession(sessionId, { status: "syncing" });
        await page.goto(platformHome[platform], {
          waitUntil: "domcontentloaded",
          timeout: 120_000,
        });
        await sleep(2000);

        const allCookies = await page.cookies();
        const userAgent = await page.evaluate(() => navigator.userAgent);
        const url = page.url();

        let healthStatus: "active" | "expired" | "challenge" = "active";
        let healthError: string | null = null;
        if (url.includes("/login") || url.includes("/i/flow/login")) {
          healthStatus = "expired";
          healthError = "Redirected to login";
        } else if (url.includes("checkpoint") || url.includes("challenge")) {
          healthStatus = "challenge";
          healthError = "Verification required";
        }

        await savePlatformCredentials({
          platform,
          cookies: allCookies,
          userAgent,
        });
        await reportSessionHealth({
          platform,
          sessionStatus: healthStatus,
          lastError: healthError,
        });

        await updateConnectBrowserSession(sessionId, {
          status: healthStatus === "active" ? "complete" : "error",
          lastError: healthError,
        });
        return;
      } finally {
        await browser.disconnect();
      }
    }

    await updateConnectBrowserSession(sessionId, {
      status: "error",
      lastError: "Login timed out",
    });
    await reportSessionHealth({
      platform,
      sessionStatus: "expired",
      lastError: "Login timed out",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connect failed";
    await updateConnectBrowserSession(sessionId, {
      status: "error",
      lastError: message,
    });
    await reportSessionHealth({
      platform,
      sessionStatus: "expired",
      lastError: message,
    });
  }
}

export async function captureHostedConnectFrame(
  env: BrowserBindingEnv,
  sessionId: string,
): Promise<Uint8Array | null> {
  const row = await getConnectBrowserSession(sessionId);
  if (!row) return null;

  const { browser, page } = await withPage(env, row.puppeteerSessionId);
  try {
    const buffer = await page.screenshot({
      type: "jpeg",
      quality: 72,
    });
    return new Uint8Array(buffer);
  } finally {
    await browser.disconnect();
  }
}

export async function sendHostedConnectInput(
  env: BrowserBindingEnv,
  sessionId: string,
  input: { type: string; x?: number; y?: number; key?: string },
): Promise<void> {
  const row = await getConnectBrowserSession(sessionId);
  if (!row) throw new Error("Session not found");

  const { browser, page } = await withPage(env, row.puppeteerSessionId);
  try {
    if (input.type === "click" && input.x != null && input.y != null) {
      await page.mouse.click(input.x, input.y);
    } else if (input.type === "key" && input.key) {
      if (input.key === "Enter") await page.keyboard.press("Enter");
      else if (input.key === "Backspace") await page.keyboard.press("Backspace");
      else if (input.key.length === 1) await page.keyboard.type(input.key);
    }
  } finally {
    await browser.disconnect();
  }
}

export async function getHostedWorkerBrowser(): Promise<{
  env: BrowserBindingEnv;
  ctx: { waitUntil: (promise: Promise<unknown>) => void };
} | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env, ctx } = await getCloudflareContext({ async: true });
    if (!(env as BrowserBindingEnv).BROWSER) return null;
    return { env: env as BrowserBindingEnv, ctx };
  } catch {
    return null;
  }
}
