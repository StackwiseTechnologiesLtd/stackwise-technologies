import {
  growthHarvestExtractInPage,
  type InPageExtractDebug,
} from "@/lib/growth/harvest-extract-in-page";
import type { GrowthPlatform, IngestSignalInput } from "@/lib/growth/types";
import type { Page } from "playwright";

export type ExtractDebug = InPageExtractDebug;

function authorFromBlockText(text: string): string {
  const line = text.split("\n").map((l) => l.trim()).find(Boolean);
  return line && line.length <= 120 ? line : "Post author";
}

export function formatExtractDebug(debug: ExtractDebug): string {
  if (debug.platform === "x") {
    return `DOM: ${debug.tweetTextNodes} tweet text nodes, ${debug.articleNodes} articles, ${debug.statusLinks} status links → ${debug.parsed} posts parsed`;
  }
  return `DOM: ${debug.linkedInBlocks} LinkedIn blocks → ${debug.parsed} posts parsed`;
}

export function rawPostsToSignals(
  platform: GrowthPlatform,
  posts: {
    bodyText: string;
    sourceUrl: string | null;
    authorName: string;
    authorHandle?: string | null;
    authorProfileUrl?: string | null;
    roleTitle?: string | null;
  }[],
): IngestSignalInput[] {
  return posts.map((p) => ({
    platform,
    sourceUrl: p.sourceUrl ?? undefined,
    authorName: authorFromBlockText(p.authorName || p.bodyText),
    authorHandle: p.authorHandle ?? undefined,
    authorProfileUrl: p.authorProfileUrl ?? undefined,
    roleTitle: p.roleTitle ?? undefined,
    bodyText: p.bodyText,
  }));
}

async function waitForPosts(page: Page, platform: GrowthPlatform) {
  const selectors =
    platform === "x"
      ? [
          '[data-testid="tweetText"]',
          'article[data-testid="tweet"]',
          'a[href*="/status/"]',
        ]
      : [
          "div.feed-shared-update-v2",
          "div[data-urn*='activity']",
          ".update-components-text",
          "li.reusable-search__result-container",
        ];

  for (const sel of selectors) {
    try {
      await page.waitForSelector(sel, { timeout: 12_000 });
      return;
    } catch {
      /* try next */
    }
  }
  await page.waitForTimeout(2000);
}

export async function extractFeedSignals(
  page: Page,
  platform: GrowthPlatform,
): Promise<{ signals: IngestSignalInput[]; debug: ExtractDebug }> {
  await waitForPosts(page, platform);
  const { posts, debug } = await page.evaluate(
    growthHarvestExtractInPage,
    platform,
  );

  return {
    signals: rawPostsToSignals(platform, posts),
    debug,
  };
}
