#!/usr/bin/env node
/**
 * Phase 6.1 smoke: meta app + account + campaign + simulate comment → delivery log.
 * Requires: npm run dev, DATABASE_URL, NODE_ENV=development (simulate route).
 *
 *   node scripts/instagram-smoke.mjs
 */
import "dotenv/config";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
if (existsSync(path.join(root, ".env.local"))) {
  config({ path: path.join(root, ".env.local"), override: true });
}

const base =
  process.env.INSTAGRAM_SMOKE_BASE?.replace(/\/$/, "") || "http://localhost:3000";

async function devAdminCookie() {
  const secret =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    "stackwise-local-admin-session-secret-32ch-min";
  const payload = {
    email: process.env.ADMIN_EMAILS?.split(",")[0]?.trim() || "admin@test.com",
    exp: Date.now() + 3600_000,
  };
  const encoded = Buffer.from(JSON.stringify(payload))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `sw_admin_session=${encoded}.${hex}`;
}

async function api(cookie, pathname, init = {}) {
  const res = await fetch(`${base}${pathname}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { res, json };
}

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
}

const stamp = Date.now();
const slug = `smoke-${stamp}`;
const igUserId = "17841400009999000";
const mediaId = "media-smoke-001";
const keyword = "GUIDE";

const cookie = await devAdminCookie();

console.log("1. Create Meta app…");
let { res, json } = await api(cookie, "/api/admin/instagram/meta-apps", {
  method: "POST",
  body: JSON.stringify({
    label: `Smoke ${stamp}`,
    slug,
    metaAppId: "000000000000000",
    appSecret: "smoke-test-app-secret-value",
    webhookVerifyToken: `verify-${stamp}`,
  }),
});
assert(res.ok, `meta-apps POST ${res.status} ${JSON.stringify(json)}`);
const appSlug = json.app?.slug ?? slug;
const metaAppRowId = json.app?.id;

console.log("2. Connect account…");
({ res, json } = await api(cookie, "/api/admin/instagram/accounts", {
  method: "POST",
  body: JSON.stringify({
    metaAppId: metaAppRowId,
    igUserId,
    username: "smoke.studio",
    accessToken: "fake-token-for-dry-run",
  }),
}));
assert(res.ok, `accounts POST ${res.status} ${JSON.stringify(json)}`);
const accountId = json.account?.id;

console.log("3. Create campaign…");
({ res, json } = await api(cookie, "/api/admin/instagram/campaigns", {
  method: "POST",
  body: JSON.stringify({
    accountId,
    name: "Smoke campaign",
    mediaId,
    keyword,
    privateReplyTemplate: "Hey {username}! Here is your link.",
  }),
}));
assert(res.ok, `campaigns POST ${res.status} ${JSON.stringify(json)}`);

console.log("4. Simulate comment webhook…");
const simulateBody = {
  object: "instagram",
  entry: [
    {
      id: igUserId,
      time: stamp,
      changes: [
        {
          field: "comments",
          value: {
            id: `comment-${stamp}`,
            text: `${keyword} please`,
            media: { id: mediaId },
            from: { id: "999888777", username: "maya.creates" },
          },
        },
      ],
    },
  ],
};
({ res, json } = await api(cookie, "/api/admin/instagram/simulate", {
  method: "POST",
  body: JSON.stringify(simulateBody),
}));
assert(res.ok, `simulate POST ${res.status} ${JSON.stringify(json)}`);

await new Promise((r) => setTimeout(r, 1500));

console.log("5. Delivery log…");
({ res, json } = await api(cookie, "/api/admin/instagram/deliveries?limit=5"));
assert(res.ok, `deliveries GET ${res.status}`);
const row = (json.deliveries || []).find(
  (d) => d.triggerExternalId === `comment-${stamp}`,
);
assert(row, "expected delivery row for simulated comment");
assert(
  row.status === "sent" || row.status === "queued" || row.status === "failed",
  `unexpected status ${row.status}`,
);
if (process.env.INSTAGRAM_DRY_RUN === "1") {
  assert(row.status === "sent", "dry run should mark sent");
}

console.log("6. Webhook verify (GET challenge)…");
const challenge = "smoke-challenge-123";
const verifyUrl = `${base}/api/webhooks/meta/${appSlug}?hub.mode=subscribe&hub.verify_token=verify-${stamp}&hub.challenge=${challenge}`;
const verifyRes = await fetch(verifyUrl, { signal: AbortSignal.timeout(60_000) });
const challengeBody = await verifyRes.text();
assert(verifyRes.ok && challengeBody === challenge, "webhook verify failed");

console.log("OK — Instagram 6.1 smoke passed");
console.log(`   Admin UI: ${base}/admin/growth/instagram`);
console.log(`   Webhook:  ${base}/api/webhooks/meta/${appSlug}`);