#!/usr/bin/env node
/**
 * Demo: LinkedIn Easy Apply with Connect cookies (headed Chromium).
 * Moves/clicks/types with human-like pacing to reduce bot signals.
 *
 *   node scripts/linkedin-easy-apply-demo.mjs
 *   node scripts/linkedin-easy-apply-demo.mjs --submit
 *   node scripts/linkedin-easy-apply-demo.mjs --url 'https://www.linkedin.com/jobs/view/…'
 *
 * Without --submit: fills steps and stops before final submit.
 * Stops immediately on checkpoint/CAPTCHA.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyStealth,
  humanClick,
  humanDelay,
  humanScroll,
  humanType,
  humanViewport,
  launchHumanBrowser,
  loadPlaywright,
  pullSession,
} from "./growth-browser-lib.mjs";
import { loadEnvLocal } from "./lib/load-env-local.mjs";

loadEnvLocal();

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const browsersRoot = path.join(repoRoot, ".playwright-browsers");
process.env.PLAYWRIGHT_BROWSERS_PATH ??= browsersRoot;
process.env.GROWTH_API_BASE ??= "http://localhost:3005";
if (
  !process.env.GROWTH_CONNECTOR_SECRET &&
  process.env.INTEGRATIONS_INGEST_SECRET
) {
  process.env.GROWTH_CONNECTOR_SECRET = process.env.INTEGRATIONS_INGEST_SECRET;
}

const wantSubmit = process.argv.includes("--submit");
const urlFlag = process.argv.indexOf("--url");
const jobUrlArg =
  urlFlag >= 0 && process.argv[urlFlag + 1]
    ? process.argv[urlFlag + 1]
    : null;

function resolveChrome() {
  const envPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  if (envPath && fs.existsSync(envPath)) return envPath;
  if (!fs.existsSync(browsersRoot)) return null;
  for (const entry of fs.readdirSync(browsersRoot)) {
    if (!entry.startsWith("chromium-")) continue;
    for (const arch of ["chrome-mac-arm64", "chrome-mac-x64"]) {
      const candidate = path.join(
        browsersRoot,
        entry,
        arch,
        "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
      );
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  const brave =
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
  return fs.existsSync(brave) ? brave : null;
}

function validateUrl(url) {
  if (
    url.includes("/login") ||
    url.includes("/checkpoint") ||
    url.includes("/challenge")
  ) {
    return false;
  }
  return true;
}

function applyDialog(page) {
  return page
    .locator('dialog[open], [data-testid="dialog"], .jobs-easy-apply-modal')
    .first();
}

async function findEasyApplyJob(page) {
  const search =
    "https://www.linkedin.com/jobs/search-results/?f_AL=true&f_WT=2&keywords=software%20engineer&sortBy=DD";
  console.log("Searching Easy Apply + remote…");
  await page.goto(search, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await humanDelay(2800, 5200);
  await humanScroll(page, 2 + Math.floor(Math.random() * 2));
  if (!validateUrl(page.url())) {
    throw new Error("Session expired or checkpoint during search");
  }

  const cards = page.locator(
    'div[role="button"][componentkey^="job-card-component-ref-"]',
  );
  const count = await cards.count();
  console.log(`Found ${count} job cards`);
  if (count === 0) throw new Error("No job cards on search results");

  // Skim a couple cards like a human before picking one with Easy Apply
  const skim = Math.min(count, 2 + Math.floor(Math.random() * 2));
  for (let i = 0; i < skim; i++) {
    await humanClick(cards.nth(i), page);
    await humanDelay(1600, 3200);
  }

  for (let i = 0; i < Math.min(count, 12); i++) {
    const card = cards.nth(i);
    const label = ((await card.innerText().catch(() => "")) || "").replace(
      /\s+/g,
      " ",
    );
    if (!/Easy Apply/i.test(label)) continue;
    await humanClick(card, page);
    await humanDelay(1800, 3200);
    const easy = page
      .locator(
        'button.jobs-apply-button, button[aria-label*="Easy Apply"], button:has-text("Easy Apply")',
      )
      .first();
    if (await easy.isVisible({ timeout: 4000 }).catch(() => false)) {
      const key = (await card.getAttribute("componentkey")) || "";
      const id = key.match(/job-card-component-ref-(\d+)/)?.[1];
      const href = id
        ? `https://www.linkedin.com/jobs/view/${id}`
        : page.url();
      console.log("Picked", label.slice(0, 120));
      return { easy, href };
    }
  }
  throw new Error("No Easy Apply button found in first cards");
}

async function fillScreening(page) {
  const root = applyDialog(page);
  // German level (or any required select) — open + pick deliberately
  const select = root.locator("select").first();
  if (await select.isVisible({ timeout: 600 }).catch(() => false)) {
    await humanClick(select, page);
    await humanDelay(400, 900);
    await select
      .selectOption({ label: "Gut" })
      .catch(() => select.selectOption({ index: 2 }));
    console.log("Selected Deutsch level");
    await humanDelay(600, 1200);
  }

  // Prefer clicking visible Ja/Nein text (not force-check radio)
  for (const label of ["Nein", "No", "Ja", "Yes"]) {
    const opt = root.getByText(label, { exact: true }).first();
    if (await opt.isVisible({ timeout: 400 }).catch(() => false)) {
      // Answer Nein / No first when present (DE work auth for Cyprus-based)
      if (label === "Nein" || label === "No") {
        await humanClick(opt, page);
        console.log(`Clicked “${label}”`);
        await humanDelay(700, 1400);
        break;
      }
    }
  }
}

async function fillVisibleInputs(page, note) {
  const root = applyDialog(page);
  await humanDelay(600, 1400);

  const textareas = root.locator("textarea");
  const taCount = await textareas.count();
  for (let i = 0; i < taCount; i++) {
    const ta = textareas.nth(i);
    if (!(await ta.isVisible().catch(() => false))) continue;
    const val = await ta.inputValue().catch(() => "");
    if (!val.trim()) {
      await humanType(ta, note, page);
      console.log("Typed cover/note");
    }
  }

  const phone = root
    .locator('input[id*="phone"], input[name*="phone"], input[type="tel"]')
    .first();
  if (await phone.isVisible({ timeout: 600 }).catch(() => false)) {
    const val = await phone.inputValue().catch(() => "");
    if (!val.trim()) {
      await humanType(phone, "+90 5488712616", page);
      console.log("Typed phone");
    }
  }

  // Resume radios — click the first visible option like a human
  const resumeRadio = root.locator('input[type="radio"]').first();
  if (await resumeRadio.count().catch(() => 0)) {
    const already = await root
      .locator('input[type="radio"]:checked')
      .count()
      .catch(() => 0);
    if (!already) {
      const label = root
        .locator('label')
        .filter({ has: root.locator('input[type="radio"]') })
        .first();
      if (await label.isVisible({ timeout: 500 }).catch(() => false)) {
        await humanClick(label, page);
      } else {
        await humanClick(resumeRadio, page);
      }
      console.log("Selected resume");
      await humanDelay(800, 1600);
    }
  }

  await fillScreening(page);
}

async function clickContinueOrReview(page) {
  const root = applyDialog(page);
  const labels = ["Continue", "Next", "Review", "Review your application"];
  for (const label of labels) {
    const btn = root.locator(`button:has-text("${label}")`).last();
    if (await btn.isVisible({ timeout: 700 }).catch(() => false)) {
      const disabled = await btn.isDisabled().catch(() => true);
      if (!disabled) {
        await humanClick(btn, page);
        console.log(`Clicked “${label}”`);
        await humanDelay(1600, 3200);
        return true;
      }
    }
  }
  return false;
}

async function clickSubmit(page) {
  const root = applyDialog(page);
  // Read the review page briefly before submitting
  await humanDelay(2200, 4500);
  const btn = root
    .locator(
      'button:has-text("Submit application"), button:has-text("Submit")',
    )
    .first();
  if (!(await btn.isVisible({ timeout: 3000 }).catch(() => false))) {
    return false;
  }
  const disabled = await btn.isDisabled().catch(() => true);
  if (disabled) {
    console.log("Submit visible but disabled — likely missing required fields");
    return false;
  }
  await humanClick(btn, page);
  console.log("Clicked Submit application");
  await humanDelay(3000, 5500);
  return true;
}

async function main() {
  process.env.GROWTH_API_BASE ??= "http://localhost:3005";
  const { cookies, userAgent } = await pullSession("linkedin");
  if (!Array.isArray(cookies) || cookies.length === 0) {
    throw new Error("No LinkedIn Connect cookies — Growth → Connect first");
  }

  const chromium = await loadPlaywright();
  const executablePath = resolveChrome();
  console.log(
    executablePath
      ? `Launching ${executablePath}`
      : "Launching Playwright default chromium",
  );
  const browser = await launchHumanBrowser(chromium, {
    headless: false,
    executablePath: executablePath ?? undefined,
  });

  const note =
    "Hi — I'm a full-stack engineer (Next.js, Node, Postgres) interested in this remote role. I've shipped production SaaS and AI integration work for founders moving MVP → reliable delivery. Happy to share a short portfolio note.";

  try {
    const context = await browser.newContext({
      userAgent: userAgent ?? undefined,
      viewport: humanViewport(),
      locale: "en-US",
      timezoneId: "Europe/Nicosia",
      deviceScaleFactor: 2,
      hasTouch: false,
    });
    await context.addCookies(cookies);
    const page = await context.newPage();
    await applyStealth(page);

    console.log("Verifying LinkedIn session…");
    await page.goto("https://www.linkedin.com/feed/", {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    await humanDelay(2500, 4800);
    await humanScroll(page, 1);
    if (!validateUrl(page.url())) {
      throw new Error("LinkedIn session expired or verification required");
    }
    console.log("Session OK");

    let easy;
    if (jobUrlArg) {
      console.log("Opening", jobUrlArg);
      await page.goto(jobUrlArg, {
        waitUntil: "domcontentloaded",
        timeout: 120_000,
      });
      // Read the posting before applying
      await humanDelay(2200, 4000);
      await humanScroll(page, 2 + Math.floor(Math.random() * 2));
      await humanDelay(1500, 3000);
      easy = page
        .locator(
          'button.jobs-apply-button, button[aria-label*="Easy Apply"], button:has-text("Easy Apply")',
        )
        .first();
      if (!(await easy.isVisible({ timeout: 8_000 }).catch(() => false))) {
        throw new Error("Easy Apply not available on this job URL");
      }
    } else {
      const found = await findEasyApplyJob(page);
      easy = found.easy;
      console.log("Selected job", found.href);
      await humanScroll(page, 1);
      await humanDelay(1200, 2400);
    }

    await humanClick(easy, page);
    console.log("Opened Easy Apply modal");
    await humanDelay(2200, 4000);

    for (let step = 0; step < 6; step++) {
      if (!validateUrl(page.url())) {
        throw new Error("Checkpoint/CAPTCHA — stopping");
      }
      await fillVisibleInputs(page, note);
      const advanced = await clickContinueOrReview(page);
      if (!advanced) break;
    }

    if (wantSubmit) {
      const submitted = await clickSubmit(page);
      if (!submitted) {
        console.log(
          "Could not submit automatically — modal left open for you to finish.",
        );
        await humanDelay(8000, 12000);
      } else {
        console.log("Submit clicked. Check LinkedIn for confirmation.");
        await humanDelay(4000, 7000);
      }
    } else {
      console.log(
        "Demo stopped before submit (pass --submit to click Submit application).",
      );
      await humanDelay(5000, 8000);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
