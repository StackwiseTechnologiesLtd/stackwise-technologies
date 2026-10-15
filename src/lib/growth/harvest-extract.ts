import type { GrowthPlatform, IngestSignalInput } from "@/lib/growth/types";
import type { Page } from "playwright";

function authorFromBlockText(text: string): string {
  const line = text.split("\n").map((l) => l.trim()).find(Boolean);
  return line && line.length <= 120 ? line : "Feed author";
}

export async function extractLinkedInSignals(
  page: Page,
): Promise<IngestSignalInput[]> {
  const articles = page.locator("div.feed-shared-update-v2");
  const count = Math.min(await articles.count(), 10);
  const signals: IngestSignalInput[] = [];
  for (let i = 0; i < count; i++) {
    const block = articles.nth(i);
    const text = (await block.innerText().catch(() => "")).trim();
    if (text.length < 40) continue;
    const link = await block
      .locator('a[href*="/feed/update"]')
      .first()
      .getAttribute("href")
      .catch(() => null);
    signals.push({
      platform: "linkedin",
      sourceUrl: link
        ? link.startsWith("http")
          ? link
          : `https://www.linkedin.com${link}`
        : undefined,
      authorName: authorFromBlockText(text),
      bodyText: text.slice(0, 4000),
    });
  }
  return signals;
}

export async function extractXSignals(page: Page): Promise<IngestSignalInput[]> {
  const selectors = [
    'article[data-testid="tweet"]',
    'article[role="article"]',
    '[data-testid="primaryColumn"] article',
  ];
  let articles = page.locator(selectors[0]);
  if ((await articles.count()) === 0) {
    articles = page.locator(selectors[1]);
  }
  if ((await articles.count()) === 0) {
    articles = page.locator(selectors[2]);
  }

  const count = Math.min(await articles.count(), 10);
  const signals: IngestSignalInput[] = [];
  for (let i = 0; i < count; i++) {
    const block = articles.nth(i);
    const text = (await block.innerText().catch(() => "")).trim();
    if (text.length < 20) continue;
    const link = await block
      .locator('a[href*="/status/"]')
      .first()
      .getAttribute("href")
      .catch(() => null);
    signals.push({
      platform: "x",
      sourceUrl: link
        ? link.startsWith("http")
          ? link
          : `https://x.com${link}`
        : undefined,
      authorName: authorFromBlockText(text),
      bodyText: text.slice(0, 4000),
    });
  }
  return signals;
}

export async function extractFeedSignals(
  page: Page,
  platform: GrowthPlatform,
): Promise<IngestSignalInput[]> {
  return platform === "linkedin"
    ? extractLinkedInSignals(page)
    : extractXSignals(page);
}
