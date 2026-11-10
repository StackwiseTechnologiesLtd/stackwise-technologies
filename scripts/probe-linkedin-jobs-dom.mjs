#!/usr/bin/env node
/**
 * Dump LinkedIn Jobs search DOM counts for selector tuning.
 *   node scripts/probe-linkedin-jobs-dom.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyStealth,
  humanDelay,
  loadPlaywright,
  pullSession,
} from "./growth-browser-lib.mjs";
import { loadEnvLocal } from "./lib/load-env-local.mjs";

loadEnvLocal();
const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(
  repoRoot,
  ".playwright-browsers",
);
process.env.GROWTH_API_BASE ??= "http://localhost:3005";
if (
  !process.env.GROWTH_CONNECTOR_SECRET &&
  process.env.INTEGRATIONS_INGEST_SECRET
) {
  process.env.GROWTH_CONNECTOR_SECRET = process.env.INTEGRATIONS_INGEST_SECRET;
}

const exe = path.join(
  repoRoot,
  ".playwright-browsers/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
);

const { cookies, userAgent } = await pullSession("linkedin");
const chromium = await loadPlaywright();
const browser = await chromium.launch({
  headless: true,
  executablePath: fs.existsSync(exe) ? exe : undefined,
});
const ctx = await browser.newContext({ userAgent: userAgent ?? undefined });
await ctx.addCookies(cookies);
const page = await ctx.newPage();
await applyStealth(page);
const url =
  "https://www.linkedin.com/jobs/search/?keywords=software%20engineer&f_WT=2&f_AL=true&location=Worldwide&sortBy=DD";
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
await humanDelay(3500, 4500);
console.log("final_url", page.url());
fs.writeFileSync("/tmp/li-jobs.html", await page.content());
const counts = await page.evaluate(() => {
  const sels = {
    "li.jobs-search-results__list-item": document.querySelectorAll(
      "li.jobs-search-results__list-item",
    ).length,
    "li.scaffold-layout__list-item": document.querySelectorAll(
      "li.scaffold-layout__list-item",
    ).length,
    "div.job-card-container": document.querySelectorAll(
      "div.job-card-container",
    ).length,
    "li[data-occludable-job-id]": document.querySelectorAll(
      "li[data-occludable-job-id]",
    ).length,
    "[data-job-id]": document.querySelectorAll("[data-job-id]").length,
    'a[href*="/jobs/view/"]': document.querySelectorAll(
      'a[href*="/jobs/view/"]',
    ).length,
    'a.job-card-list__title--link': document.querySelectorAll(
      "a.job-card-list__title--link",
    ).length,
    "div.job-card-list": document.querySelectorAll("div.job-card-list").length,
  };
  const sampleLinks = [...document.querySelectorAll('a[href*="/jobs/"]')]
    .slice(0, 10)
    .map((a) => ({
      href: a.getAttribute("href")?.slice(0, 160),
      text: a.innerText?.trim().slice(0, 90),
      cls: typeof a.className === "string" ? a.className.slice(0, 100) : "",
    }));
  return {
    sels,
    sampleLinks,
    title: document.title,
    textStart: document.body?.innerText?.slice(0, 700),
  };
});
console.log(JSON.stringify(counts, null, 2));
await browser.close();
