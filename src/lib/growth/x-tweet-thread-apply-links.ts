import type { Page } from "playwright";
import { normalizeTweetUrl } from "@/lib/growth/publish-x-reply";
import {
  extractUrlsFromPostText,
  pickBestApplyUrl,
  postBodyNeedsThreadApplyLink,
} from "@/lib/growth/x-apply-urls";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Collect external URLs from the hiring tweet and replies in the conversation. */
export async function scrapeApplyUrlsFromTweetConversation(
  page: Page,
  tweetUrl: string,
  _authorHandle?: string | null,
): Promise<string[]> {
  const url = normalizeTweetUrl(tweetUrl);
  if (!url) return [];

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await sleep(2000);

  const collected = await page.evaluate(() => {
    const out: string[] = [];
    const articles = document.querySelectorAll('article[data-testid="tweet"]');
    articles.forEach((article) => {
      article.querySelectorAll('a[href^="http"]').forEach((a) => {
        const href = (a as HTMLAnchorElement).href;
        if (href && !href.includes("/status/")) out.push(href);
      });
      const text = (article as HTMLElement).innerText ?? "";
      const urlRe = /https?:\/\/[^\s]+/gi;
      for (const m of text.matchAll(urlRe)) out.push(m[0]);
    });
    return out;
  });

  const merged = [...collected.flatMap((t) => extractUrlsFromPostText(t))];
  return [...new Set(merged)];
}

export async function resolveXApplyUrlWithThread(
  page: Page,
  tweetUrl: string,
  bodyText: string,
): Promise<string | null> {
  const fromBody = pickBestApplyUrl(extractUrlsFromPostText(bodyText));
  if (fromBody) return fromBody;

  if (!normalizeTweetUrl(tweetUrl)) return null;
  if (!postBodyNeedsThreadApplyLink(bodyText)) return null;

  const urls = await scrapeApplyUrlsFromTweetConversation(page, tweetUrl);
  return pickBestApplyUrl(urls);
}