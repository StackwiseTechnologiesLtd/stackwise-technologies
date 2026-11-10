/**
 * Shared helpers for local Playwright connector (runs on your Mac/VPS — not on Cloudflare Workers).
 */

import fs from "node:fs";

export const base = process.env.GROWTH_API_BASE ?? "http://localhost:3000";

export function authHeaders() {
  const secret = process.env.GROWTH_CONNECTOR_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Set GROWTH_CONNECTOR_SECRET (32+ characters) in the environment.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secret}`,
  };
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Random pause like a human reading or moving the pointer. */
export async function humanDelay(minMs = 800, maxMs = 2800) {
  const span = Math.max(0, maxMs - minMs);
  const ms = minMs + Math.floor(Math.random() * (span + 1));
  await sleep(ms);
}

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randInt(min, max) {
  return Math.floor(randBetween(min, max + 1));
}

/**
 * Ease mouse along a slightly curved path (not a straight teleport).
 * LinkedIn heuristics notice instant cursor jumps.
 */
export async function humanMoveTo(page, x, y, steps = 18) {
  // Playwright doesn't expose current mouse pos; start from a natural viewport spot.
  const vp = page.viewportSize() ?? { width: 1280, height: 800 };
  const fromX = randBetween(vp.width * 0.25, vp.width * 0.75);
  const fromY = randBetween(vp.height * 0.25, vp.height * 0.75);
  const midX = (fromX + x) / 2 + randBetween(-40, 40);
  const midY = (fromY + y) / 2 + randBetween(-30, 30);
  const n = Math.max(8, steps + randInt(-4, 6));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    // Quadratic bezier
    const bx =
      (1 - t) * (1 - t) * fromX + 2 * (1 - t) * t * midX + t * t * x;
    const by =
      (1 - t) * (1 - t) * fromY + 2 * (1 - t) * t * midY + t * t * y;
    await page.mouse.move(bx, by);
    await sleep(randInt(8, 28));
  }
  // Tiny settle jitter
  await page.mouse.move(x + randBetween(-2, 2), y + randBetween(-2, 2));
}

/** Hover near element center with offset, pause, then click — no force. */
export async function humanClick(locator, page, { readingMs } = {}) {
  await locator.scrollIntoViewIfNeeded().catch(() => undefined);
  await humanDelay(200, 600);
  const box = await locator.boundingBox();
  if (!box) {
    await locator.click({ timeout: 15_000 });
    return;
  }
  const x = box.x + box.width * randBetween(0.35, 0.65);
  const y = box.y + box.height * randBetween(0.35, 0.65);
  await humanMoveTo(page, x, y);
  await humanDelay(readingMs ?? randInt(180, 520));
  await page.mouse.down();
  await sleep(randInt(40, 120));
  await page.mouse.up();
  await humanDelay(400, 1100);
}

/** Type like a person: variable key delay, occasional longer pauses. */
export async function humanType(locator, text, page) {
  await humanClick(locator, page, { readingMs: randInt(120, 350) });
  // Clear existing with select-all + backspace feel
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+A" : "Control+A",
  );
  await sleep(randInt(60, 140));
  await page.keyboard.press("Backspace");
  await humanDelay(200, 500);
  for (const ch of text) {
    await page.keyboard.type(ch, { delay: 0 });
    await sleep(randInt(35, 110));
    if (Math.random() < 0.08) await sleep(randInt(180, 420));
  }
  await humanDelay(300, 700);
}

export async function loadPlaywright() {
  try {
    const { chromium } = await import("playwright");
    return chromium;
  } catch {
    throw new Error(
      "Playwright is not installed. Run: npm install -D playwright && npx playwright install chromium",
    );
  }
}

export async function launchHumanBrowser(chromium, { headless = false, executablePath } = {}) {
  return chromium.launch({
    headless,
    // Keep slowMo modest — we add our own delays for realism.
    slowMo: headless ? 0 : randInt(25, 55),
    executablePath: executablePath || undefined,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-infobars",
    ],
  });
}

export async function applyStealth(page) {
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en", "de"],
    });
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });
    window.chrome = { runtime: {} };
    const originalQuery = window.navigator.permissions?.query?.bind(
      window.navigator.permissions,
    );
    if (originalQuery) {
      window.navigator.permissions.query = (parameters) =>
        parameters?.name === "notifications"
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters);
    }
  });
}

/** Read the page a bit: irregular scroll + pauses. */
export async function humanScroll(page, passes = 3) {
  for (let i = 0; i < passes; i++) {
    const delta = 180 + Math.floor(Math.random() * 420);
    await page.mouse.wheel(0, delta);
    await humanDelay(900, 2800);
    if (Math.random() < 0.25) {
      await page.mouse.wheel(0, -randInt(40, 120));
      await humanDelay(400, 900);
    }
  }
}

/** Slight viewport jitter so every session isn't identical. */
export function humanViewport() {
  return {
    width: 1280 + randInt(-40, 80),
    height: 800 + randInt(-30, 60),
  };
}

export const platformLogin = {
  linkedin: "https://www.linkedin.com/login",
  x: "https://x.com/i/flow/login",
};

export const platformHome = {
  linkedin: "https://www.linkedin.com/feed/",
  x: "https://x.com/home",
};

export const sessionCookieName = {
  linkedin: "li_at",
  x: "auth_token",
};

export async function uploadSession(platform, { cookies, userAgent, displayLabel }) {
  const res = await fetch(`${base}/api/admin/growth/credentials`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      platform,
      cookies,
      userAgent,
      displayLabel,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `Upload failed HTTP ${res.status}`);
  }
}

export async function pullSession(platform) {
  const res = await fetch(
    `${base}/api/admin/growth/connector/credentials?platform=${encodeURIComponent(platform)}`,
    { headers: authHeaders() },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `Pull failed HTTP ${res.status}`);
  }
  return { cookies: json.cookies, userAgent: json.userAgent };
}

export async function reportHealth(platform, sessionStatus, extra = {}) {
  const res = await fetch(`${base}/api/admin/growth/sessions/health`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      platform,
      sessionStatus,
      lastError: extra.lastError ?? null,
      connectedAccountLabel: extra.connectedAccountLabel ?? null,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `Health report failed HTTP ${res.status}`);
  }
}

export async function waitForSessionCookie(context, platform, timeoutMs = 600_000) {
  const name = sessionCookieName[platform];
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const cookies = await context.cookies();
    if (cookies.some((c) => c.name === name && c.value)) {
      return true;
    }
    await sleep(2000);
  }
  return false;
}

export function withinBusinessHours() {
  const hour = new Date().getHours();
  return hour >= 8 && hour < 20;
}

export async function assertBusinessHours() {
  if (process.env.GROWTH_IGNORE_BUSINESS_HOURS === "1") return;
  if (!withinBusinessHours()) {
    console.log(
      "Outside local 08:00–20:00 — skipping harvest to avoid bot-like night activity. Set GROWTH_IGNORE_BUSINESS_HOURS=1 to override.",
    );
    process.exit(0);
  }
}

export function writeSignalsFile(path, signals) {
  fs.writeFileSync(path, JSON.stringify({ signals }, null, 2));
}

export async function pushSignals(fileOrSignals) {
  let signals;
  if (typeof fileOrSignals === "string") {
    const raw = fs.readFileSync(fileOrSignals, "utf8");
    const parsed = JSON.parse(raw);
    signals = Array.isArray(parsed) ? parsed : parsed.signals;
  } else {
    signals = fileOrSignals;
  }
  if (!Array.isArray(signals) || signals.length === 0) {
    throw new Error("No signals to push");
  }
  const res = await fetch(`${base}/api/admin/growth/connector/ingest`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ signals }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `Ingest HTTP ${res.status}`);
  }
  return json.ingested ?? signals.length;
}
