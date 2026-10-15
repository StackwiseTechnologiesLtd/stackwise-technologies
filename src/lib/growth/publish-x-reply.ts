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

export function tweetIdFromUrl(url: string): string | null {
  const match = url.match(/status\/(\d+)/);
  return match?.[1] ?? null;
}

const EDITOR_SELECTORS = [
  '[data-testid="tweetTextarea_0"] div[contenteditable="true"]',
  '[data-testid="tweetTextarea_0"]',
  'div[contenteditable="true"][data-testid="tweetTextarea_0"]',
  'div.public-DraftEditor-content[contenteditable="true"]',
  'div[contenteditable="true"][role="textbox"]',
  '[aria-label="Post text"]',
  '[aria-label="Post your reply"]',
];

const REPLY_BUTTON_SELECTORS = [
  '[data-testid="reply"]',
  'button[data-testid="reply"]',
  'a[href*="/compose/post"]',
];

async function waitForTweetShell(page: Page) {
  const selectors = [
    'article[data-testid="tweet"]',
    '[data-testid="primaryColumn"]',
    '[data-testid="tweetText"]',
  ];
  for (const sel of selectors) {
    try {
      await page.waitForSelector(sel, { timeout: 12_000 });
      return;
    } catch {
      /* try next */
    }
  }
  await humanDelay(1500, 2500);
}

async function focusReplyEditor(page: Page): Promise<boolean> {
  for (const sel of EDITOR_SELECTORS) {
    const loc = page.locator(sel).first();
    try {
      await loc.waitFor({ state: "visible", timeout: 4000 });
      await loc.scrollIntoViewIfNeeded();
      await loc.click({ timeout: 8000 });
      return true;
    } catch {
      /* try next */
    }
  }

  try {
    const byRole = page.getByRole("textbox", { name: /post your reply|post text/i }).first();
    await byRole.waitFor({ state: "visible", timeout: 4000 });
    await byRole.click();
    return true;
  } catch {
    return false;
  }
}

async function typeReply(page: Page, text: string): Promise<boolean> {
  const focused = await focusReplyEditor(page);
  if (!focused) return false;

  await page.keyboard.press("Meta+A").catch(() => page.keyboard.press("Control+A"));
  await page.keyboard.press("Backspace").catch(() => undefined);
  await page.keyboard.type(text, { delay: 14 });
  return true;
}

async function clickReplyOnMainTweet(page: Page): Promise<boolean> {
  const article = page.locator('article[data-testid="tweet"]').first();
  try {
    await article.waitFor({ state: "visible", timeout: 10_000 });
    await article.scrollIntoViewIfNeeded();
  } catch {
    return false;
  }

  for (const sel of REPLY_BUTTON_SELECTORS) {
    const btn = article.locator(sel).first();
    try {
      if (await btn.isVisible({ timeout: 2000 })) {
        await btn.click({ timeout: 8000 });
        await humanDelay(600, 1200);
        return true;
      }
    } catch {
      /* try next */
    }
  }

  try {
    const reply = article.getByRole("button", { name: /^reply$/i }).first();
    await reply.click({ timeout: 8000 });
    await humanDelay(600, 1200);
    return true;
  } catch {
    return false;
  }
}

async function submitReply(page: Page): Promise<boolean> {
  const postSelectors = [
    '[data-testid="tweetButton"]:not([disabled])',
    '[data-testid="tweetButtonInline"]:not([disabled])',
    'button[data-testid="tweetButton"]',
  ];

  for (const sel of postSelectors) {
    const loc = page.locator(sel).first();
    try {
      await loc.waitFor({ state: "visible", timeout: 5000 });
      await loc.click({ timeout: 10_000 });
      return true;
    } catch {
      /* try next */
    }
  }

  try {
    await page.getByRole("button", { name: /^reply$|^post$/i }).first().click({
      timeout: 10_000,
    });
    return true;
  } catch {
    return false;
  }
}

async function postViaIntentUrl(
  page: Page,
  tweetUrl: string,
  text: string,
): Promise<{ ok: true } | { ok: false; error: string } | null> {
  const id = tweetIdFromUrl(tweetUrl);
  if (!id) return null;

  const intent = new URL("https://x.com/intent/tweet");
  intent.searchParams.set("in_reply_to", id);
  intent.searchParams.set("text", text);

  await page.goto(intent.toString(), {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await humanDelay(2000, 3500);

  if (page.url().includes("/login")) {
    return { ok: false, error: "X session expired — reconnect in Settings" };
  }

  const typed = await typeReply(page, text);
  if (!typed) {
    const hasText = await page.evaluate(
      (expected) => document.body?.innerText?.includes(expected.slice(0, 40)),
      text,
    );
    if (!hasText) {
      return {
        ok: false,
        error: "Could not find reply text field on X (intent compose)",
      };
    }
  }

  const submitted = await submitReply(page);
  if (!submitted) {
    return { ok: false, error: "Could not submit reply on X (intent compose)" };
  }

  await humanDelay(2000, 3500);
  return { ok: true };
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
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await waitForTweetShell(page);
  await humanDelay(1500, 3000);

  if (page.url().includes("/login") || page.url().includes("/i/flow/login")) {
    return { ok: false, error: "X session expired — reconnect in Settings" };
  }

  // Permalink pages often show an inline "Post your reply" box without tapping Reply.
  if (await typeReply(page, text)) {
    if (await submitReply(page)) {
      await humanDelay(2000, 3500);
      return { ok: true };
    }
  }

  if (await clickReplyOnMainTweet(page)) {
    await humanDelay(800, 1500);
    if (await typeReply(page, text) && (await submitReply(page))) {
      await humanDelay(2000, 3500);
      return { ok: true };
    }
  }

  const intent = await postViaIntentUrl(page, url, text);
  if (intent) return intent;

  return {
    ok: false,
    error:
      "Could not find reply field on X — try reconnecting, or post via Copy and paste manually",
  };
}

export async function publishXReplyWithPlaywright(
  cookies: Cookie[],
  userAgent: string | null,
  tweetUrl: string,
  replyText: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { chromium } = await import("playwright");
  const headed = process.env.GROWTH_PUBLISH_HEADED === "1";
  const browser = await chromium.launch({
    headless: !headed,
    slowMo: headed ? 80 : 0,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  try {
    const context = await browser.newContext({
      userAgent: userAgent ?? undefined,
      viewport: { width: 1280, height: 900 },
    });
    await context.addCookies(cookies);
    const page = await context.newPage();
    await applyStealth(page);
    return await postXReplyOnPage(page, tweetUrl, replyText);
  } finally {
    await browser.close();
  }
}
