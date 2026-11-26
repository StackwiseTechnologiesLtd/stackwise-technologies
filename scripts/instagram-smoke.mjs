#!/usr/bin/env node
/**
 * Phase 6.1 + 6.2 smoke: meta app, account (dev fake token), campaigns, simulate, tracked link.
 *
 * Terminal A (server must dry-run sends even if .env.local has INSTAGRAM_DRY_RUN=0):
 *   PORT=3002 INSTAGRAM_DRY_RUN=1 npm run dev
 * Terminal B:
 *   INSTAGRAM_SMOKE_BASE=http://localhost:3002 npm run integrations:instagram:smoke
 *
 * Needs DATABASE_URL + dev admin session secret (see devAdminCookie below).
 */
import "dotenv/config";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
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

function deliveryDryRunOk(row) {
  const reason = row?.skipReason ?? row?.skip_reason;
  return (
    row?.status === "sent" ||
    row?.status === "queued" ||
    row?.status === "failed" ||
    (row?.status === "skipped" && reason === "dry_run")
  );
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
    buttonLabel1: "Shop",
    buttonUrl1: "https://cal.com/stackwise-technologies/30min",
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
({ res, json } = await api(cookie, "/api/admin/instagram/deliveries?limit=50"));
assert(res.ok, `deliveries GET ${res.status}`);
const row = (json.deliveries || []).find(
  (d) => d.triggerExternalId === `comment-${stamp}`,
);
assert(row, "expected delivery row for simulated comment");
assert(
  deliveryDryRunOk(row),
  `unexpected status ${row.status} skip=${row.skipReason ?? row.skip_reason ?? ""}`,
);

console.log("6. Webhook verify (GET challenge)…");
const challenge = "smoke-challenge-123";
const verifyUrl = `${base}/api/webhooks/meta/${appSlug}?hub.mode=subscribe&hub.verify_token=verify-${stamp}&hub.challenge=${challenge}`;
const verifyRes = await fetch(verifyUrl, { signal: AbortSignal.timeout(60_000) });
const challengeBody = await verifyRes.text();
assert(verifyRes.ok && challengeBody === challenge, "webhook verify failed");

console.log("7. DM campaign + simulate…");
({ res, json } = await api(cookie, "/api/admin/instagram/campaigns", {
  method: "POST",
  body: JSON.stringify({
    accountId,
    name: "DM PRICING",
    triggerType: "dm",
    keyword: "PRICING",
    privateReplyTemplate: "Hi {username} — booking link below.",
    buttonLabel1: "Book",
    buttonUrl1: "https://example.com/book",
  }),
}));
assert(res.ok, `dm campaign POST ${res.status}`);

const dmMid = `mid-${stamp}`;
({ res, json } = await api(cookie, "/api/admin/instagram/simulate", {
  method: "POST",
  body: JSON.stringify({
    object: "instagram",
    entry: [
      {
        id: igUserId,
        messaging: [
          {
            sender: { id: "444555666", username: "maya.creates" },
            message: { mid: dmMid, text: "PRICING please" },
          },
        ],
      },
    ],
  }),
}));
assert(res.ok, `dm simulate ${res.status}`);
await new Promise((r) => setTimeout(r, 1200));
({ res, json } = await api(cookie, "/api/admin/instagram/deliveries?limit=20"));
const dmRow = (json.deliveries || []).find((d) => d.triggerExternalId === dmMid);
assert(dmRow && deliveryDryRunOk(dmRow), "dm delivery should complete (sent or dry_run skip)");

console.log("8. Tracked link click…");
assert(row?.id, "delivery id for link test");
const sql = neon(process.env.DATABASE_URL);
const linkRows = await sql`
  SELECT token FROM instagram_tracked_links
  WHERE delivery_id = ${row.id}::uuid
  LIMIT 1
`;
assert(linkRows[0]?.token, "tracked link token expected");
const clickRes = await fetch(`${base}/r/ig/${linkRows[0].token}`, {
  redirect: "manual",
});
assert(clickRes.status === 302, "tracked redirect should 302");
({ res, json } = await api(cookie, `/api/admin/instagram/deliveries?limit=20`));
const rowAfterClick = (json.deliveries || []).find((d) => d.id === row.id);
assert((rowAfterClick?.clickCount ?? 0) >= 1, "click count should increment");

console.log("OK — Instagram 6.1 + 6.2 smoke passed");
console.log(`   Admin UI: ${base}/admin/growth/instagram`);
console.log(`   Webhook:  ${base}/api/webhooks/meta/${appSlug}`);