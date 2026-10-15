/** Runs inside the browser (Playwright/Puppeteer evaluate). No Node imports. */

export type InPageExtractDebug = {
  platform: "x" | "linkedin";
  tweetTextNodes: number;
  articleNodes: number;
  statusLinks: number;
  linkedInBlocks: number;
  parsed: number;
};

export type InPageRawPost = {
  bodyText: string;
  sourceUrl: string | null;
  authorName: string;
};

export function growthHarvestExtractInPage(
  plat: "x" | "linkedin",
): { posts: InPageRawPost[]; debug: InPageExtractDebug } {
  const posts: InPageRawPost[] = [];
  const seen = new Set<string>();

  const push = (
    bodyText: string,
    sourceUrl: string | null,
    authorName: string,
  ) => {
    const text = bodyText.trim();
    if (text.length < 15) return;
    const key = sourceUrl ?? text.slice(0, 200);
    if (seen.has(key)) return;
    seen.add(key);
    posts.push({
      bodyText: text.slice(0, 4000),
      sourceUrl,
      authorName: authorName.slice(0, 120) || "Post author",
    });
  };

  if (plat === "x") {
    const tweetTextNodes = document.querySelectorAll('[data-testid="tweetText"]');
    const articleNodes = document.querySelectorAll(
      'article[data-testid="tweet"], article[role="article"]',
    );
    const statusLinks = document.querySelectorAll('a[href*="/status/"]');

    tweetTextNodes.forEach((node) => {
      const text = (node as HTMLElement).innerText?.trim() ?? "";
      const article = node.closest("article");
      const linkEl = article?.querySelector(
        'a[href*="/status/"]',
      ) as HTMLAnchorElement | null;
      const href = linkEl?.getAttribute("href") ?? null;
      const sourceUrl = href
        ? href.startsWith("http")
          ? href
          : `https://x.com${href}`
        : null;
      const userEl = article?.querySelector('[data-testid="User-Name"]');
      const authorName =
        userEl?.textContent?.split("\n")[0]?.trim() ||
        text.split("\n")[0]?.trim() ||
        "Post author";
      push(text, sourceUrl, authorName);
    });

    if (posts.length === 0) {
      articleNodes.forEach((article) => {
        const text = (article as HTMLElement).innerText?.trim() ?? "";
        const linkEl = article.querySelector(
          'a[href*="/status/"]',
        ) as HTMLAnchorElement | null;
        const href = linkEl?.getAttribute("href") ?? null;
        const sourceUrl = href
          ? href.startsWith("http")
            ? href
            : `https://x.com${href}`
          : null;
        push(text, sourceUrl, text.split("\n")[0]?.trim() || "Post author");
      });
    }

    if (posts.length === 0) {
      statusLinks.forEach((link) => {
        const href = link.getAttribute("href");
        if (!href) return;
        const cell =
          link.closest('[data-testid="cellInnerDiv"]') ?? link.parentElement;
        const text = (cell as HTMLElement | null)?.innerText?.trim() ?? "";
        const sourceUrl = href.startsWith("http")
          ? href
          : `https://x.com${href}`;
        push(text, sourceUrl, text.split("\n")[0]?.trim() || "Post author");
      });
    }

    return {
      posts,
      debug: {
        platform: "x",
        tweetTextNodes: tweetTextNodes.length,
        articleNodes: articleNodes.length,
        statusLinks: statusLinks.length,
        linkedInBlocks: 0,
        parsed: posts.length,
      },
    };
  }

  const linkedInBlocks = document.querySelectorAll(
    "div.feed-shared-update-v2, div[data-urn*='activity'], li.reusable-search__result-container",
  );
  const updateTexts = document.querySelectorAll(".update-components-text");

  linkedInBlocks.forEach((block) => {
    const text = (block as HTMLElement).innerText?.trim() ?? "";
    const linkEl = block.querySelector(
      'a[href*="/feed/update"], a[href*="activity-"]',
    ) as HTMLAnchorElement | null;
    const href = linkEl?.getAttribute("href") ?? null;
    const sourceUrl = href
      ? href.startsWith("http")
        ? href
        : `https://www.linkedin.com${href}`
      : null;
    push(text, sourceUrl, text.split("\n")[0]?.trim() || "Post author");
  });

  if (posts.length === 0) {
    updateTexts.forEach((node) => {
      const text = (node as HTMLElement).innerText?.trim() ?? "";
      const container = node.closest("div[data-urn], .feed-shared-update-v2");
      const linkEl = container?.querySelector(
        'a[href*="/feed/update"]',
      ) as HTMLAnchorElement | null;
      const href = linkEl?.getAttribute("href") ?? null;
      const sourceUrl = href
        ? href.startsWith("http")
          ? href
          : `https://www.linkedin.com${href}`
        : null;
      push(text, sourceUrl, "Post author");
    });
  }

  return {
    posts,
    debug: {
      platform: "linkedin",
      tweetTextNodes: 0,
      articleNodes: 0,
      statusLinks: 0,
      linkedInBlocks: linkedInBlocks.length,
      parsed: posts.length,
    },
  };
}
