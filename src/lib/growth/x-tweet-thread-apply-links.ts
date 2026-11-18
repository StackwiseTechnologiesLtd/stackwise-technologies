import type { Page } from "playwright";
import { normalizeTweetUrl } from "@/lib/growth/publish-x-reply";
import {
  extractUrlsFromPostText,
  pickBestApplyUrl,
} from "@/lib/growth/x-apply-urls";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Collect external URLs from the hiring tweet and same-author replies in the conversation. */
export async function scrapeApplyUrlsFromTweetConversation(
  page: Page,
  tweetUrl: string,
  authorHandle?: string | null,
): Promise<string[]> {
  const url = normalizeTweetUrl(tweetUrl);
  if (!url) return [];

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await sleep(2000);

  const handle = authorHandle?.replace(/^@/, "").toLowerCase() ?? null;

  const linkTexts = await page.evaluate((preferredHandle) => {
    const out: string[] = [];
    const articles = document.querySelectorAll('article[data-testid="tweet"]');
    articles.forEach((article) => {
      const anchors = article.querySelectorAll('a[href^="http"]');
      let authorMatch = true;
      if (preferredHandle) {
        const profile = article.querySelector('a[href*="/"]') as HTMLAnchorElement | null;
        const href = profile?.getAttribute("href") ?? "";
        authorMatch = href.toLowerCase().includes(`/${preferredHandle}`);
      }
      anchors.forEach((a) => {
        const href = (a as HTMLAnchorElement).href;
        if (!href || href.includes("/status/")) return;
        if (authorMatch || articles.length <= 2) {
          out.push(href);
        }
      });
      const text = (article as HTMLElement).innerText ?? "";
      const urlRe = /https?:\/\/[^\s]+/gi;
      for (const m of text.matchAll(urlRe)) {
        if (authorMatch || articles.length <= 2) out.push(m[0]);
      }
    });
    return out;
  }, handle);

  const merged = [
    ...extractUrlsFromPostText(await page.locator('article[data-testid="tweet"]').first().innerText().catch(() => "")),
    ...linkTexts.flatMap((t) => extractUrlsFromPostText(t)),
  ];
  return [...new Set(merged)];
}

export async function resolveXApplyUrlWithThread(
  page: Page,
  tweetUrl: string,
  bodyText: string,
  authorHandle?: string | null,
): Promise<string | null> {
  const fromBody = pickBestApplyUrl(extractUrlsFromPostText(bodyText));
  if (fromBody) return fromBody;

  const needThread =
    postBodyNeedsThreadFromImport(bodyText) || !fromBody;
  if (!needThread && !fromBody) return null;

  const urls = await scrapeApplyUrlsFromTweetConversation(
    page,
    tweetUrl,
    authorHandle,
  );
  return pickBestApplyUrl(urls);
}

function postBodyNeedsThreadFromImport(bodyText: string): boolean {
  // Avoid circular import in evaluate path — duplicate tiny check
  return /\b(apply\s+link\s+in|link\s+in\s+(the\s+)?(main\s+)?post|apply\s+now\s*!?\s*👇)\b/i.test(
    bodyText,
  );
}