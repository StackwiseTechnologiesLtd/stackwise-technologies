#!/usr/bin/env node
/**
 * Headed browser login → encrypted cookie upload → session health ping.
 *
 * Usage: node scripts/growth-connect.mjs <linkedin|x>
 */

import {
  applyStealth,
  humanDelay,
  launchHumanBrowser,
  loadPlaywright,
  platformHome,
  platformLogin,
  reportHealth,
  uploadSession,
  waitForSessionCookie,
} from "./growth-browser-lib.mjs";

const platform = process.argv[2];
if (platform !== "linkedin" && platform !== "x") {
  console.error("Usage: node scripts/growth-connect.mjs <linkedin|x>");
  process.exit(1);
}

async function detectAccountLabel(page, platform) {
  try {
    if (platform === "linkedin") {
      const el = page.locator("button.global-nav__primary-link-me-menu-trigger").first();
      if (await el.count()) {
        return (await el.getAttribute("aria-label")) ?? null;
      }
    }
    if (platform === "x") {
      const el = page.locator('[data-testid="SideNav_AccountSwitcher_Button"]').first();
      if (await el.count()) {
        return (await el.innerText()).trim() || null;
      }
    }
  } catch {
    /* optional */
  }
  return null;
}

async function validateSession(page, platform) {
  const url = page.url();
  if (url.includes("/login") || url.includes("/i/flow/login")) {
    return { status: "expired", error: "Redirected to login" };
  }
  if (url.includes("checkpoint") || url.includes("challenge")) {
    return { status: "challenge", error: "Verification or checkpoint required" };
  }
  const label = await detectAccountLabel(page, platform);
  return { status: "active", connectedAccountLabel: label };
}

async function main() {
  const chromium = await loadPlaywright();
  const browser = await launchHumanBrowser(chromium, { headless: false });
  const context = await browser.newContext({
    viewport: {
      width: 1280 + Math.floor(Math.random() * 80),
      height: 800 + Math.floor(Math.random() * 60),
    },
  });
  const page = await context.newPage();
  await applyStealth(page);

  console.log(`Opening ${platform} login — complete sign-in in the browser window.`);
  await page.goto(platformLogin[platform], { waitUntil: "domcontentloaded" });
  await humanDelay(1500, 3000);

  const gotCookie = await waitForSessionCookie(context, platform);
  if (!gotCookie) {
    await browser.close();
    throw new Error("Timed out waiting for session cookie. Try again.");
  }

  await humanDelay(2000, 4000);
  await page.goto(platformHome[platform], { waitUntil: "domcontentloaded" });
  await humanDelay(2500, 5000);

  const cookies = await context.cookies();
  const userAgent = await page.evaluate(() => navigator.userAgent);
  const label = await detectAccountLabel(page, platform);

  await uploadSession(platform, {
    cookies,
    userAgent,
    displayLabel: label,
  });
  console.log("Uploaded encrypted session to Stackwise.");

  const check = await validateSession(page, platform);
  await reportHealth(platform, check.status, {
    lastError: check.error ?? null,
    connectedAccountLabel: check.connectedAccountLabel ?? label,
  });
  console.log(`Session health: ${check.status}`);

  await humanDelay(800, 1500);
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
