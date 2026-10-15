/** Runs in the browser during connect / harvest. */

export function growthDetectAccountLabelInPage(
  plat: "x" | "linkedin",
): string | null {
  if (plat === "x") {
    const switcherSelectors = [
      '[data-testid="SideNav_AccountSwitcher_Button"]',
      '[data-testid="AccountSwitcher_Button"]',
      '[data-testid="SideNav_AccountSwitcher_Button"] span',
    ];
    for (const sel of switcherSelectors) {
      const el = document.querySelector(sel);
      const text = (el as HTMLElement | null)?.innerText?.trim();
      if (text) return normalizeXAccountText(text);
    }

    const profileLink = document.querySelector(
      'a[data-testid="AppTabBar_Profile_Link"], a[href^="/"][role="link"]',
    );
    const href = profileLink?.getAttribute("href") ?? "";
    const handleMatch = href.match(/^\/([A-Za-z0-9_]{1,30})$/);
    if (handleMatch) return `@${handleMatch[1]}`;

    const meta = document.querySelector('meta[property="og:url"]');
    const ogUrl = meta?.getAttribute("content") ?? "";
    const ogMatch = ogUrl.match(/x\.com\/([A-Za-z0-9_]+)/i);
    if (ogMatch && ogMatch[1] !== "home") return `@${ogMatch[1]}`;

    return null;
  }

  const me = document.querySelector(
    'button.global-nav__primary-link-me-menu-trigger, img.global-nav__me-photo',
  );
  const aria = me?.getAttribute("aria-label")?.trim();
  if (aria) return aria.replace(/^View\s+/i, "").replace(/['']s profile.*$/i, "").trim();

  const nameEl = document.querySelector(
    "h1.text-heading-xlarge, .pv-text-details__left-panel h1",
  );
  const name = (nameEl as HTMLElement | null)?.innerText?.trim();
  return name || null;
}

function normalizeXAccountText(raw: string): string {
  const line =
    raw
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? raw.trim();
  const handle = line.match(/@[A-Za-z0-9_]+/);
  if (handle) return handle[0];
  if (/^[A-Za-z0-9_]+$/.test(line.split(/\s/)[0] ?? "")) {
    return `@${line.split(/\s/)[0]}`;
  }
  return line.slice(0, 80);
}
