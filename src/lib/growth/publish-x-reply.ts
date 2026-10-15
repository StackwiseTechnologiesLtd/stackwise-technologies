import type { Cookie, Page } from "playwright";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function humanDelay(minMs = 600, maxMs = 1800) {
  const span = Math.max(0, maxMs - minMs);
  return sleep(minMs + Math.floor(Math.random() * (span + 1)));
}

async function applyStealth(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });
}

export function normalizeTweetUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("x.com") && !parsed.hostname.includes("twitter.com")) {
      return null;
    }
    if (!parsed.pathname.includes("/status/")) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function postXReplyOnPage(
  page: Page,
  tweetUrl: string,
  replyText: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = normalizeTweetUrl(tweetUrl);
  const text = replyText.trim();
  if (!url) return { ok: false, error: "Invalid tweet URL" };
  if (!text) return { ok: false, error: "Reply text is empty" };
  if (text.length > 280) {
    return {
      ok: false,
      error: `Reply is ${text.length} characters — X allows 280 max`,
    };
  }

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await humanDelay(2000, 4000);

  if (page.url().includes("/login") || page.url().includes("/i/flow/login")) {
    return { ok: false, error: "X session expired — reconnect in Settings" };
  }

  const replySelectors = [
    '[data-testid="reply"]',
    'button[aria-label*="Reply"]',
    'a[href*="/compose/post"][role="link"]',
  ];

  let clicked = false;
  for (const sel of replySelectors) {
    const loc = page.locator(sel).first();
    if (await loc.count()) {
      await loc.click({ timeout: 15_000 });
      clicked = true;
      break;
    }
  }
  if (!clicked) {
    return { ok: false, error: "Could not open reply composer on X" };
  }

  await humanDelay(800, 1600);

  const editorSelectors = [
    '[data-testid="tweetTextarea_0"] div[contenteditable="true"]',
    '[data-testid="tweetTextarea_0"]',
    'div[contenteditable="true"][role="textbox"]',
  ];

  let filled = false;
  for (const sel of editorSelectors) {
    const loc = page.locator(sel).first();
    if (await loc.count()) {
      await loc.click();
      await page.keyboard.type(text, { delay: 12 });
      filled = true;
      break;
    }
  }
  if (!filled) {
    return { ok: false, error: "Could not find reply text field on X" };
  }

  await humanDelay(500, 1200);

  const postSelectors = [
    '[data-testid="tweetButton"]',
    '[data-testid="tweetButtonInline"]',
    'button[data-testid="tweetButton"]:not([disabled])',
  ];

  for (const sel of postSelectors) {
    const loc = page.locator(sel).first();
    if (await loc.count()) {
      await loc.click({ timeout: 15_000 });
      await humanDelay(2500, 4500);
      return { ok: true };
    }
  }

  return { ok: false, error: "Could not submit reply on X" };
}

export async function publishXReplyWithPlaywright(
  cookies: Cookie[],
  userAgent: string | null,
  tweetUrl: string,
  replyText: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
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
    return await postXReplyOnPage(page, tweetUrl, replyText);
  } finally {
    await browser.close();
  }
}
