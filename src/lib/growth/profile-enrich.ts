import type { GrowthPlatform } from "@/lib/growth/types";

export type BrowserPage = {
  goto(url: string, options?: object): Promise<unknown>;
  evaluate<R>(pageFunction: () => R): Promise<R>;
  evaluate<R, Arg>(pageFunction: (arg: Arg) => R, arg: Arg): Promise<R>;
  waitForTimeout?(ms: number): Promise<void>;
};

export type ProfileEnrichment = {
  profileUrl: string;
  summary: string;
  roleTitle: string | null;
  companyName: string | null;
};

export function growthHarvestProfileInPage(): {
  summary: string;
  roleTitle: string | null;
  companyName: string | null;
} {
  const parts: string[] = [];

  const xBio = document.querySelector('[data-testid="UserDescription"]');
  const xName = document.querySelector('[data-testid="UserName"]');
  const xLocation = document.querySelector('[data-testid="UserLocation"]');
  const xUrl = document.querySelector('[data-testid="UserUrl"]');

  const liHeadline = document.querySelector(
    ".text-body-medium.break-words, .pv-text-details__left-panel h1 + div",
  );
  const liAbout = document.querySelector(
    "#about ~ div.display-flex.ph5.pv3 span[aria-hidden='true'], section.pv-about-section",
  );
  const liName = document.querySelector("h1.text-heading-xlarge, h1.inline");

  if (xName) parts.push(`Name block: ${(xName as HTMLElement).innerText?.trim()}`);
  if (xBio) parts.push(`Bio: ${(xBio as HTMLElement).innerText?.trim()}`);
  if (xLocation) parts.push(`Location: ${(xLocation as HTMLElement).innerText?.trim()}`);
  if (xUrl) parts.push(`Link: ${(xUrl as HTMLElement).innerText?.trim()}`);

  if (liName) parts.push(`Name: ${(liName as HTMLElement).innerText?.trim()}`);
  if (liHeadline) {
    parts.push(`Headline: ${(liHeadline as HTMLElement).innerText?.trim()}`);
  }
  if (liAbout) parts.push(`About: ${(liAbout as HTMLElement).innerText?.trim()?.slice(0, 1200)}`);

  if (parts.length === 0) {
    const title = document.title?.trim();
    const body = document.body?.innerText?.trim().slice(0, 1500) ?? "";
    parts.push(title ? `Page: ${title}` : "", body);
  }

  const summary = parts.filter(Boolean).join("\n").slice(0, 2500);
  const headline =
    (liHeadline as HTMLElement | null)?.innerText?.trim() ||
    (xBio as HTMLElement | null)?.innerText?.trim()?.split("\n")[0] ||
    null;

  let roleTitle: string | null = headline?.slice(0, 200) ?? null;
  let companyName: string | null = null;
  if (headline?.includes("@")) {
    companyName = headline.split("@").pop()?.trim().slice(0, 120) ?? null;
  } else if (headline?.includes(" at ")) {
    const seg = headline.split(" at ");
    roleTitle = seg[0]?.trim().slice(0, 200) ?? roleTitle;
    companyName = seg[1]?.trim().slice(0, 120) ?? null;
  }

  return { summary, roleTitle, companyName };
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function enrichProfileFromPage(
  page: BrowserPage,
  profileUrl: string,
  _platform: GrowthPlatform,
): Promise<ProfileEnrichment | null> {
  if (!profileUrl.startsWith("http")) return null;

  try {
    await page.goto(profileUrl, {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    const waitMs = 1500 + Math.floor(Math.random() * 1500);
    if (page.waitForTimeout) {
      await page.waitForTimeout(waitMs);
    } else {
      await pause(waitMs);
    }

    const data = await page.evaluate(growthHarvestProfileInPage);
    if (!data.summary.trim()) return null;

    return {
      profileUrl,
      summary: data.summary,
      roleTitle: data.roleTitle,
      companyName: data.companyName,
    };
  } catch {
    return null;
  }
}

export function profileUrlFromPost(
  platform: GrowthPlatform,
  authorProfileUrl?: string | null,
  authorHandle?: string | null,
): string | null {
  if (authorProfileUrl?.startsWith("http")) return authorProfileUrl;
  const handle = authorHandle?.replace(/^@/, "").trim();
  if (!handle) return null;
  if (platform === "x") return `https://x.com/${handle}`;
  return `https://www.linkedin.com/in/${handle}`;
}
