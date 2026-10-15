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

export async function launchHumanBrowser(chromium, { headless = false } = {}) {
  return chromium.launch({
    headless,
    slowMo: headless ? 0 : 40,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-default-browser-check",
    ],
  });
}

export async function applyStealth(page) {
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    window.chrome = { runtime: {} };
  });
}

export async function humanScroll(page, passes = 3) {
  for (let i = 0; i < passes; i++) {
    const delta = 280 + Math.floor(Math.random() * 520);
    await page.mouse.wheel(0, delta);
    await humanDelay(1200, 3400);
  }
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
