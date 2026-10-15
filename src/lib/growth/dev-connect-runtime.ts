import {
  platformHome,
  platformLogin,
  sessionCookieName,
} from "@/lib/growth/connect-platform";
import { detectAccountLabelOnPage } from "@/lib/growth/detect-account-label";
import {
  reportSessionHealth,
  savePlatformCredentials,
} from "@/lib/growth/repository";
import type { GrowthPlatform } from "@/lib/growth/types";
import type { Browser, BrowserContext, Page } from "playwright";

const VIEWPORT = { width: 1100, height: 720 };

export type DevConnectStatus =
  | "starting"
  | "login"
  | "syncing"
  | "complete"
  | "error";

type DevConnectSession = {
  id: string;
  platform: GrowthPlatform;
  status: DevConnectStatus;
  lastFrame: Buffer | null;
  lastError: string | null;
  browser: Browser;
  context: BrowserContext;
  page: Page;
};

type DevConnectStore = {
  sessions: Map<string, DevConnectSession>;
};

const storeKey = "__stackwise_dev_connect__";

function getStore(): DevConnectStore {
  const g = globalThis as typeof globalThis & {
    [storeKey]?: DevConnectStore;
  };
  if (!g[storeKey]) {
    g[storeKey] = { sessions: new Map() };
  }
  return g[storeKey];
}

export function isDevConnectRuntimeEnabled(): boolean {
  if (process.env.GROWTH_CONNECT_FORCE_LOCAL === "1") return true;
  return process.env.NODE_ENV === "development";
}

export async function isDevConnectRuntimeReady(): Promise<boolean> {
  if (!isDevConnectRuntimeEnabled()) return false;
  try {
    await import("playwright");
    return true;
  } catch {
    return false;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function humanDelay(minMs = 800, maxMs = 2400) {
  const span = Math.max(0, maxMs - minMs);
  return sleep(minMs + Math.floor(Math.random() * (span + 1)));
}

async function loadChromium() {
  const { chromium } = await import("playwright");
  return chromium;
}

async function applyStealth(page: Page) {
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    // @ts-expect-error injected in page
    window.chrome = { runtime: {} };
  });
}

async function waitForSessionCookie(
  context: BrowserContext,
  platform: GrowthPlatform,
  timeoutMs = 600_000,
) {
  const name = sessionCookieName[platform];
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const cookies = await context.cookies();
    if (cookies.some((c) => c.name === name && c.value)) return true;
    await sleep(2000);
  }
  return false;
}

async function runLoginWatcher(session: DevConnectSession) {
  const { platform } = session;
  try {
    session.status = "login";
    await session.page.goto(platformLogin[platform], {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    await humanDelay(1200, 2400);

    const gotCookie = await waitForSessionCookie(session.context, platform);
    if (!gotCookie) {
      session.status = "error";
      session.lastError = "Login timed out";
      return;
    }

    session.status = "syncing";
    await session.page.goto(platformHome[platform], {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    await humanDelay(2000, 4000);

    const cookies = await session.context.cookies();
    const userAgent = await session.page.evaluate(() => navigator.userAgent);
    const label = await detectAccountLabelOnPage(session.page, platform);
    const url = session.page.url();

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
      cookies,
      userAgent,
      displayLabel: label ?? undefined,
    });
    await reportSessionHealth({
      platform,
      sessionStatus: healthStatus,
      lastError: healthError,
      connectedAccountLabel: label,
    });

    session.status = healthStatus === "active" ? "complete" : "error";
    session.lastError = healthError;
  } catch (error) {
    session.status = "error";
    session.lastError = error instanceof Error ? error.message : String(error);
    try {
      await reportSessionHealth({
        platform,
        sessionStatus: "expired",
        lastError: session.lastError,
      });
    } catch {
      /* ignore */
    }
  }
}

export async function startDevConnectSession(
  platform: GrowthPlatform,
): Promise<{ sessionId: string; interaction: "headed" | "stream" }> {
  if (!isDevConnectRuntimeEnabled()) {
    throw new Error("Dev connect is not enabled in this environment");
  }

  const chromium = await loadChromium();
  const browser = await chromium.launch({
    headless: false,
    slowMo: 40,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  await applyStealth(page);

  const id = crypto.randomUUID();
  const session: DevConnectSession = {
    id,
    platform,
    status: "starting",
    lastFrame: null,
    lastError: null,
    browser,
    context,
    page,
  };
  getStore().sessions.set(id, session);

  void runLoginWatcher(session);

  return { sessionId: id, interaction: "headed" };
}

export function getDevConnectStatus(sessionId: string) {
  const session = getStore().sessions.get(sessionId);
  if (!session) return null;
  return {
    status: session.status,
    lastError: session.lastError,
    platform: session.platform,
  };
}

export async function getDevConnectFrame(
  sessionId: string,
): Promise<Buffer | null> {
  const session = getStore().sessions.get(sessionId);
  if (!session) return null;
  if (session.lastFrame) return session.lastFrame;
  try {
    const buf = await session.page.screenshot({ type: "jpeg", quality: 72 });
    return Buffer.from(buf);
  } catch {
    return null;
  }
}

export async function sendDevConnectInput(
  sessionId: string,
  input: { type: string; x?: number; y?: number; key?: string },
) {
  const session = getStore().sessions.get(sessionId);
  if (!session) throw new Error("Session not found");
  const page = session.page;
  if (input.type === "click" && input.x != null && input.y != null) {
    await page.mouse.click(input.x, input.y);
  } else if (input.type === "key" && input.key) {
    if (input.key === "Enter") await page.keyboard.press("Enter");
    else if (input.key === "Backspace") await page.keyboard.press("Backspace");
    else if (input.key.length === 1) await page.keyboard.type(input.key);
  }
}
