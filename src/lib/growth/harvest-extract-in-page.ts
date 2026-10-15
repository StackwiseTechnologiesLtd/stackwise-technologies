/** Runs inside the browser (Playwright/Puppeteer evaluate). No Node imports. */

export type InPageExtractDebug = {
  platform: "x" | "linkedin";
  tweetTextNodes: number;
  articleNodes: number;
  statusLinks: number;
  linkedInBlocks: number;
  linkedInListItems: number;
  linkedInExpandableText: number;
  linkedInComponentKeyFeeds: number;
  parsed: number;
};

export type InPageRawPost = {
  bodyText: string;
  sourceUrl: string | null;
  authorName: string;
  authorHandle: string | null;
  authorProfileUrl: string | null;
  roleTitle: string | null;
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
    authorHandle: string | null,
    authorProfileUrl: string | null,
    roleTitle: string | null,
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
      authorHandle,
      authorProfileUrl,
      roleTitle,
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
      const userText = userEl?.textContent ?? "";
      const authorName =
        userText.split("\n")[0]?.trim() ||
        text.split("\n")[0]?.trim() ||
        "Post author";
      const profileLink = userEl?.querySelector(
        'a[href^="/"]',
      ) as HTMLAnchorElement | null;
      const profileHref = profileLink?.getAttribute("href") ?? null;
      const authorProfileUrl = profileHref
        ? profileHref.startsWith("http")
          ? profileHref
          : `https://x.com${profileHref}`
        : null;
      const handleMatch = profileHref?.match(/^\/([^/]+)/);
      const authorHandle = handleMatch ? `@${handleMatch[1]}` : null;
      const roleTitle = userText.split("\n")[1]?.trim()?.slice(0, 200) || null;
      push(
        text,
        sourceUrl,
        authorName,
        authorHandle,
        authorProfileUrl,
        roleTitle,
      );
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
        push(
          text,
          sourceUrl,
          text.split("\n")[0]?.trim() || "Post author",
          null,
          null,
          null,
        );
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
        push(
          text,
          sourceUrl,
          text.split("\n")[0]?.trim() || "Post author",
          null,
          null,
          null,
        );
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
        linkedInListItems: 0,
        linkedInExpandableText: 0,
        linkedInComponentKeyFeeds: 0,
        parsed: posts.length,
      },
    };
  }

  const expandButtons = document.querySelectorAll(
    'button[data-testid="expandable-text-button"], button[aria-expanded="false"][aria-label*="more"], .feed-shared-inline-show-more-text__see-more-less-toggle',
  );
  expandButtons.forEach((btn) => {
    try {
      (btn as HTMLButtonElement).click();
    } catch {
      /* ignore */
    }
  });

  const linkedInListItems = document.querySelectorAll('div[role="listitem"]');
  const linkedInExpandableText = document.querySelectorAll(
    '[data-testid="expandable-text-box"]',
  );
  const linkedInComponentKeyFeeds = document.querySelectorAll(
    '[componentkey*="FeedType"]',
  );

  const roots = new Set<HTMLElement>();
  const addRoot = (el: Element | null | undefined) => {
    if (el instanceof HTMLElement) roots.add(el);
  };

  document
    .querySelectorAll(
      "div.feed-shared-update-v2, div[data-urn^='urn:li:activity'], div[data-urn*='ugcPost'], li.reusable-search__result-container, li.reusable-searchresult-container",
    )
    .forEach((el) => addRoot(el));

  linkedInExpandableText.forEach((textEl) => {
    addRoot(
      textEl.closest('div[role="listitem"]') ??
        textEl.closest("[componentkey]") ??
        textEl.closest("li") ??
        textEl.parentElement?.parentElement,
    );
  });

  linkedInComponentKeyFeeds.forEach((el) => {
    if (
      el.querySelector(
        '[data-testid="expandable-text-box"], .update-components-text, button[aria-label*="Like"], button[aria-label*="React Like"]',
      )
    ) {
      addRoot(el as HTMLElement);
    }
  });

  linkedInListItems.forEach((li) => {
    if (
      li.querySelector(
        '[data-testid="expandable-text-box"], .update-components-text, a[href*="/in/"], button[aria-label*="Like"], button[aria-label*="React Like"]',
      )
    ) {
      addRoot(li as HTMLElement);
    }
  });

  const absLinkedInUrl = (href: string | null): string | null => {
    if (!href) return null;
    return href.startsWith("http") ? href : `https://www.linkedin.com${href}`;
  };

  const textFromRoot = (root: HTMLElement): string => {
    const textEl = root.querySelector(
      '[data-testid="expandable-text-box"], .update-components-text, .feed-shared-inline-show-more-text, [componentkey*="feed-commentary"], .feed-shared-text-view span[dir="ltr"]',
    );
    if (textEl) {
      const t = (textEl as HTMLElement).innerText?.trim() ?? "";
      if (t.length >= 15) return t;
    }
    const raw = root.innerText?.trim() ?? "";
    const trimmed = raw.split(/\n(?:Like|Comment|Repost|Send)\b/)[0]?.trim() ?? raw;
    return trimmed;
  };

  const authorFromRoot = (
    root: HTMLElement,
  ): { name: string; profileUrl: string | null; roleTitle: string | null } => {
    const nameEl = root.querySelector(
      '.update-components-actor__title span[aria-hidden="true"], .update-components-actor__name span[aria-hidden="true"], .feed-shared-actor__name span[aria-hidden="true"], a[href*="/in/"] span[aria-hidden="true"]',
    );
    const profileLink = root.querySelector(
      'a[href*="/in/"]',
    ) as HTMLAnchorElement | null;
    const menuBtn = root.querySelector(
      'button[aria-label*="post by"], button[aria-label*="Post by"]',
    ) as HTMLButtonElement | null;

    let name = nameEl?.textContent?.trim() ?? "";
    if (!name && menuBtn?.ariaLabel) {
      const match = menuBtn.ariaLabel.match(/post by\s+(.+?)(?:\.|$)/i);
      if (match?.[1]) name = match[1].trim();
    }
    if (!name) name = "Post author";

    const subtitle =
      root
        .querySelector(
          ".update-components-actor__description, .feed-shared-actor__description",
        )
        ?.textContent?.trim()
        ?.slice(0, 200) ?? null;

    return {
      name,
      profileUrl: absLinkedInUrl(profileLink?.getAttribute("href") ?? null),
      roleTitle: subtitle,
    };
  };

  const sourceFromRoot = (root: HTMLElement): string | null => {
    const linkEl = root.querySelector(
      'a[href*="/feed/update/"], a[href*="/posts/"], a[href*="activity-"]',
    ) as HTMLAnchorElement | null;
    return absLinkedInUrl(linkEl?.getAttribute("href") ?? null);
  };

  roots.forEach((root) => {
    const text = textFromRoot(root);
    const { name, profileUrl, roleTitle } = authorFromRoot(root);
    push(text, sourceFromRoot(root), name, null, profileUrl, roleTitle);
  });

  if (posts.length === 0) {
    document
      .querySelectorAll(
        'a[href*="/feed/update/"], a[href*="/posts/"], a[href*="linkedin.com/posts/"]',
      )
      .forEach((link) => {
        const root =
          link.closest('[data-urn], div[role="listitem"], li, [componentkey]') ??
          link.parentElement?.parentElement;
        const text = root
          ? textFromRoot(root as HTMLElement)
          : ((link as HTMLElement).innerText?.trim() ?? "");
        const href = link.getAttribute("href");
        push(
          text,
          absLinkedInUrl(href),
          authorFromRoot((root as HTMLElement) ?? document.body).name,
          null,
          null,
          null,
        );
      });
  }

  return {
    posts,
    debug: {
      platform: "linkedin",
      tweetTextNodes: 0,
      articleNodes: 0,
      statusLinks: 0,
      linkedInBlocks: roots.size,
      linkedInListItems: linkedInListItems.length,
      linkedInExpandableText: linkedInExpandableText.length,
      linkedInComponentKeyFeeds: linkedInComponentKeyFeeds.length,
      parsed: posts.length,
    },
  };
}
