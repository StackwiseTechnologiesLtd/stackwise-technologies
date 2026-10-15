#!/usr/bin/env node
/**
 * Local connect helper: streams a real Chromium login session into an iframe in admin.
 * Run: npm run growth:connect-server
 *
 * Env: GROWTH_CONNECTOR_SECRET, GROWTH_API_BASE (optional), GROWTH_CONNECT_PORT (default 9234)
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { randomUUID } from "node:crypto";

function loadEnvFile(filename) {
  const envPath = path.join(process.cwd(), filename);
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");
import {
  applyStealth,
  authHeaders,
  base,
  humanDelay,
  launchHumanBrowser,
  loadPlaywright,
  platformHome,
  platformLogin,
  reportHealth,
  uploadSession,
  waitForSessionCookie,
} from "./growth-browser-lib.mjs";

const port = Number(process.env.GROWTH_CONNECT_PORT ?? 9234);
const VIEWPORT = { width: 1100, height: 720 };

/** @type {Map<string, Session>} */
const sessions = new Map();

async function validateToken(token) {
  const res = await fetch(`${base}/api/admin/growth/connect/validate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ token }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.valid ? json.platform : null;
}

async function detectAccountLabel(page, platform) {
  try {
    if (platform === "linkedin") {
      const el = page.locator("button.global-nav__primary-link-me-menu-trigger").first();
      if (await el.count()) return (await el.getAttribute("aria-label")) ?? null;
    }
    if (platform === "x") {
      const el = page.locator('[data-testid="SideNav_AccountSwitcher_Button"]').first();
      if (await el.count()) return (await el.innerText()).trim() || null;
    }
  } catch {
    /* optional */
  }
  return null;
}

async function startSession(platform, token) {
  const id = randomUUID();
  const chromium = await loadPlaywright();
  const browser = await launchHumanBrowser(chromium, { headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  await applyStealth(page);

  const session = {
    id,
    platform,
    browser,
    context,
    page,
    status: "starting",
    lastFrame: null,
    lastError: null,
    cdp: null,
  };
  sessions.set(id, session);

  void (async () => {
    try {
      const client = await context.newCDPSession(page);
      session.cdp = client;
      await client.send("Page.startScreencast", {
        format: "jpeg",
        quality: 72,
        everyNthFrame: 1,
      });
      client.on("Page.screencastFrame", async (frame) => {
        session.lastFrame = Buffer.from(frame.data, "base64");
        try {
          await client.send("Page.screencastFrameAck", { sessionId: frame.sessionId });
        } catch {
          /* closed */
        }
      });

      session.status = "login";
      await page.goto(platformLogin[platform], { waitUntil: "domcontentloaded", timeout: 120_000 });
      await humanDelay(1200, 2400);

      const gotCookie = await waitForSessionCookie(context, platform, 600_000);
      if (!gotCookie) {
        session.status = "error";
        session.lastError = "Login timed out";
        return;
      }

      session.status = "syncing";
      await page.goto(platformHome[platform], { waitUntil: "domcontentloaded", timeout: 120_000 });
      await humanDelay(2000, 4000);

      const cookies = await context.cookies();
      const userAgent = await page.evaluate(() => navigator.userAgent);
      const label = await detectAccountLabel(page, platform);

      await uploadSession(platform, { cookies, userAgent, displayLabel: label });

      const url = page.url();
      let healthStatus = "active";
      let healthError = null;
      if (url.includes("/login") || url.includes("/i/flow/login")) {
        healthStatus = "expired";
        healthError = "Redirected to login";
      } else if (url.includes("checkpoint") || url.includes("challenge")) {
        healthStatus = "challenge";
        healthError = "Verification required";
      }

      await reportHealth(platform, healthStatus, {
        lastError: healthError,
        connectedAccountLabel: label,
      });

      session.status = healthStatus === "active" ? "complete" : "error";
      session.lastError = healthError;
    } catch (error) {
      session.status = "error";
      session.lastError = error instanceof Error ? error.message : String(error);
      try {
        await reportHealth(platform, "expired", { lastError: session.lastError });
      } catch {
        /* ignore */
      }
    }
  })();

  return id;
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

const EMBED_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Stackwise connect</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #0a0a0a; color: #e5e5e5; font-family: system-ui, sans-serif; }
    #bar { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; }
    #stage { position: relative; width: 100%; aspect-ratio: 1100 / 720; max-height: calc(100vh - 40px); background: #111; }
    canvas { width: 100%; height: 100%; display: block; cursor: default; }
    #status { color: #a3a3a3; }
    .done { color: #34d399; }
    .err { color: #fbbf24; }
  </style>
</head>
<body>
  <div id="bar">
    <span id="status">Starting browser…</span>
    <span id="hint">Click inside to interact · log in as you normally would</span>
  </div>
  <div id="stage">
    <canvas id="c" width="1100" height="720" tabindex="0"></canvas>
  </div>
  <script>
    const sessionId = new URLSearchParams(location.search).get("session");
    const canvas = document.getElementById("c");
    const ctx = canvas.getContext("2d");
    const statusEl = document.getElementById("status");
    const scaleX = () => canvas.width / canvas.clientWidth;
    const scaleY = () => canvas.height / canvas.clientHeight;

    async function poll() {
      if (!sessionId) return;
      try {
        const st = await fetch("/v1/status/" + sessionId).then((r) => r.json());
        if (st.status === "complete") {
          statusEl.textContent = "Connected — you can close this panel.";
          statusEl.className = "done";
          window.parent.postMessage({ type: "growth-connect-complete", sessionId }, "*");
          return;
        }
        if (st.status === "error") {
          statusEl.textContent = st.lastError || "Connection failed";
          statusEl.className = "err";
          window.parent.postMessage({ type: "growth-connect-error", message: st.lastError }, "*");
          return;
        }
        if (st.status === "login") statusEl.textContent = "Waiting for you to sign in…";
        if (st.status === "syncing") statusEl.textContent = "Saving session…";
      } catch (_) {}
      setTimeout(poll, 800);
    }

    async function paint() {
      if (!sessionId) return;
      try {
        const res = await fetch("/v1/frame/" + sessionId);
        if (res.ok) {
          const blob = await res.blob();
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(img.src);
          };
          img.src = URL.createObjectURL(blob);
        }
      } catch (_) {}
      requestAnimationFrame(() => setTimeout(paint, 180));
    }

    async function sendInput(payload) {
      await fetch("/v1/input/" + sessionId, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    canvas.addEventListener("click", (e) => {
      const x = Math.round(e.offsetX * scaleX());
      const y = Math.round(e.offsetY * scaleY());
      void sendInput({ type: "click", x, y });
    });

    canvas.addEventListener("keydown", (e) => {
      void sendInput({ type: "key", key: e.key, code: e.code });
      e.preventDefault();
    });

    poll();
    paint();
    canvas.focus();
  </script>
</body>
</html>`;

function applyCors(req, res) {
  const allowed = (process.env.GROWTH_CONNECT_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = req.headers.origin;
  if (!allowed.length) {
    res.setHeader("Access-Control-Allow-Origin", origin ?? "*");
  } else if (origin && allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const server = http.createServer(async (req, res) => {
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);

  try {
    if (url.pathname === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (url.pathname === "/v1/embed" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(EMBED_HTML);
      return;
    }

    if (url.pathname === "/v1/sessions" && req.method === "POST") {
      const body = await readJson(req);
      const platform = await validateToken(body.token);
      if (!platform) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid or expired connect token" }));
        return;
      }
      const sessionId = await startSession(platform, body.token);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ sessionId, embedUrl: `/v1/embed?session=${sessionId}` }));
      return;
    }

    const frameMatch = url.pathname.match(/^\/v1\/frame\/([^/]+)$/);
    if (frameMatch && req.method === "GET") {
      const session = sessions.get(frameMatch[1]);
      if (!session?.lastFrame) {
        res.writeHead(204);
        res.end();
        return;
      }
      res.writeHead(200, { "Content-Type": "image/jpeg" });
      res.end(session.lastFrame);
      return;
    }

    const statusMatch = url.pathname.match(/^\/v1\/status\/([^/]+)$/);
    if (statusMatch && req.method === "GET") {
      const session = sessions.get(statusMatch[1]);
      if (!session) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "not found" }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: session.status,
          lastError: session.lastError,
          platform: session.platform,
        }),
      );
      return;
    }

    const inputMatch = url.pathname.match(/^\/v1\/input\/([^/]+)$/);
    if (inputMatch && req.method === "POST") {
      const session = sessions.get(inputMatch[1]);
      if (!session?.page) {
        res.writeHead(404);
        res.end();
        return;
      }
      const body = await readJson(req);
      const page = session.page;
      if (body.type === "click") {
        await page.mouse.click(body.x, body.y);
      } else if (body.type === "key" && body.key?.length === 1) {
        await page.keyboard.type(body.key);
      } else if (body.type === "key" && body.key === "Enter") {
        await page.keyboard.press("Enter");
      } else if (body.type === "key" && body.key === "Backspace") {
        await page.keyboard.press("Backspace");
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : "error" }));
  }
});

const host = process.env.GROWTH_CONNECT_HOST ?? "127.0.0.1";
server.listen(port, host, () => {
  console.log(`Growth connect server listening on http://${host}:${port}`);
  if (host === "127.0.0.1") {
    console.log("Keep this running while you use Connect in the admin UI.");
  }
});
