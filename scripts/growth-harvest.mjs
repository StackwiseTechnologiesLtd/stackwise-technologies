#!/usr/bin/env node
/**
 * Read-only harvest with human pacing. Pulls stored session, browses home feed, pushes signals.
 *
 * Usage: node scripts/growth-harvest.mjs <linkedin|x> [--dry-run]
 */

import {
  applyStealth,
  assertBusinessHours,
  humanDelay,
  humanScroll,
  launchHumanBrowser,
  loadPlaywright,
  platformHome,
  pullSession,
  pushSignals,
  reportHealth,
  sessionCookieName,
} from "./growth-browser-lib.mjs";

const platform = process.argv[2];
const dryRun = process.argv.includes("--dry-run");

if (platform !== "linkedin" && platform !== "x") {
  console.error("Usage: node scripts/growth-harvest.mjs <linkedin|x> [--dry-run]");
  process.exit(1);
}

function authorFromBlockText(text) {
  const line = text.split("\n").map((l) => l.trim()).find(Boolean);
  return line && line.length <= 120 ? line : "Feed author";
}

async function extractLinkedInSignals(page) {
  const articles = page.locator("div.feed-shared-update-v2");
  const count = Math.min(await articles.count(), 8);
  const signals = [];
  for (let i = 0; i < count; i++) {
    const block = articles.nth(i);
    const text = (await block.innerText().catch(() => "")).trim();
    if (text.length < 40) continue;
    const link = await block.locator('a[href*="/feed/update"]').first().getAttribute("href").catch(() => null);
    signals.push({
      platform: "linkedin",
      sourceUrl: link ? (link.startsWith("http") ? link : `https://www.linkedin.com${link}`) : null,
      authorName: authorFromBlockText(text),
      authorHandle: null,
      bodyText: text.slice(0, 4000),
      capturedAt: new Date().toISOString(),
    });
    await humanDelay(400, 1200);
  }
  return signals;
}

async function extractXSignals(page) {
  const articles = page.locator('article[data-testid="tweet"]');
  const count = Math.min(await articles.count(), 8);
  const signals = [];
  for (let i = 0; i < count; i++) {
    const block = articles.nth(i);
    const text = (await block.innerText().catch(() => "")).trim();
    if (text.length < 20) continue;
    const link = await block.locator('a[href*="/status/"]').first().getAttribute("href").catch(() => null);
    signals.push({
      platform: "x",
      sourceUrl: link ? (link.startsWith("http") ? link : `https://x.com${link}`) : null,
      authorName: authorFromBlockText(text),
      authorHandle: null,
      bodyText: text.slice(0, 4000),
      capturedAt: new Date().toISOString(),
    });
    await humanDelay(400, 1200);
  }
  return signals;
}

async function validateSession(page) {
  const url = page.url();
  if (url.includes("/login") || url.includes("/i/flow/login")) {
    return { status: "expired", error: "Session expired — run growth-connect again" };
  }
  if (url.includes("checkpoint") || url.includes("challenge")) {
    return { status: "challenge", error: "Verification required in browser" };
  }
  return { status: "active" };
}

async function main() {
  await assertBusinessHours();

  const { cookies, userAgent } = await pullSession(platform);
  const cookieName = sessionCookieName[platform];
  const hasSession = Array.isArray(cookies) && cookies.some((c) => c.name === cookieName);
  if (!hasSession) {
    throw new Error(`Stored session missing ${cookieName}. Run growth-connect first.`);
  }

  const chromium = await loadPlaywright();
  const browser = await launchHumanBrowser(chromium, {
    headless: process.env.GROWTH_HEADLESS === "1",
  });
  const context = await browser.newContext({
    userAgent: userAgent ?? undefined,
  });
  await context.addCookies(cookies);
  const page = await context.newPage();
  await applyStealth(page);

  await page.goto(platformHome[platform], { waitUntil: "domcontentloaded" });
  await humanDelay(3000, 6000);

  const check = await validateSession(page);
  await reportHealth(platform, check.status, { lastError: check.error ?? null });
  if (check.status !== "active") {
    await browser.close();
    throw new Error(check.error ?? "Session not active");
  }

  const passes = 2 + Math.floor(Math.random() * 3);
  await humanScroll(page, passes);
  await humanDelay(1500, 3500);

  const signals =
    platform === "linkedin"
      ? await extractLinkedInSignals(page)
      : await extractXSignals(page);

  console.log(`Captured ${signals.length} signal(s) from ${platform}.`);

  if (!dryRun && signals.length > 0) {
    const ingested = await pushSignals(signals);
    console.log(`Ingested ${ingested} signal(s).`);
  } else if (dryRun) {
    console.log(JSON.stringify(signals, null, 2));
  }

  await humanDelay(500, 1200);
  await browser.close();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  try {
    await reportHealth(platform, "expired", {
      lastError: error instanceof Error ? error.message : String(error),
    });
  } catch {
    /* ignore */
  }
  process.exit(1);
});
