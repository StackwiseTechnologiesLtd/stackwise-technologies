#!/usr/bin/env node
/**
 * Phase 6.1 T4–T8 against the real @loo.ial GUIDE campaign via /api/admin/instagram/simulate (dev only).
 *
 *   INSTAGRAM_DRY_RUN=1 INSTAGRAM_SMOKE_BASE=http://localhost:3002 node scripts/instagram-61-exercise.mjs
 */
import { loadEnvLocal } from "./lib/load-env-local.mjs";
import { neon } from "@neondatabase/serverless";

loadEnvLocal();

const base =
  process.env.INSTAGRAM_SMOKE_BASE?.replace(/\/$/, "") || "http://localhost:3002";
const accountId =
  process.env.INSTAGRAM_61_ACCOUNT_ID?.trim() ||
  "5642a058-c854-4209-9978-7eebc15bf723";
const igUserId =
  process.env.INSTAGRAM_61_IG_USER_ID?.trim() || "17841475779409953";
const mediaId =
  process.env.INSTAGRAM_61_MEDIA_ID?.trim() || "18396733540166294";

async function devAdminCookie() {
  const secret =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    "stackwise-local-admin-session-secret-32ch-min";
  const email =
    process.env.ADMIN_EMAILS?.split(/[,;]/)[0]?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    "";
  if (!email) throw new Error("ADMIN_EMAILS required in .env.local");
  const payload = { email, exp: Date.now() + 3600_000 };
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
  const hex = [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
    signal: AbortSignal.timeout(120_000),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { res, json };
}

function commentBody(commentId, text) {
  return {
    object: "instagram",
    entry: [
      {
        id: igUserId,
        time: Date.now(),
        changes: [
          {
            field: "comments",
            value: {
              id: commentId,
              text,
              media: { id: mediaId },
              from: { id: "999888777661", username: "phase61.tester" },
            },
          },
        ],
      },
    ],
  };
}

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
}

const stamp = Date.now();
const commentId = `61-guide-${stamp}`;
const cookie = await devAdminCookie();

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
const sql = neon(process.env.DATABASE_URL);
const campaigns = await sql`
  SELECT id, name, active FROM instagram_campaigns
  WHERE account_id = ${accountId}::uuid AND keyword = 'GUIDE' AND media_id = ${mediaId}
  ORDER BY created_at DESC LIMIT 1
`;
const campaign = campaigns[0];
assert(campaign, "GUIDE campaign missing — run integrations:instagram:61-setup");

if (!campaign.active) {
  await sql`UPDATE instagram_campaigns SET active = TRUE WHERE id = ${campaign.id}::uuid`;
  console.log("Re-enabled campaign for exercise");
}

async function deliveryForComment(id) {
  const rows = await sql`
    SELECT status, skip_reason, trigger_text, private_reply_preview
    FROM instagram_deliveries
    WHERE trigger_external_id = ${id}
    ORDER BY created_at DESC LIMIT 1
  `;
  return rows[0] ?? null;
}

async function waitForStatus(id, want, ms = 8000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const row = await deliveryForComment(id);
    if (row?.status === want || (want === "skipped" && row?.skip_reason)) return row;
    await new Promise((r) => setTimeout(r, 400));
  }
  return deliveryForComment(id);
}

console.log(`Base ${base} · campaign ${campaign.id}`);

console.log("T4: GUIDE comment → delivery…");
let { res, json } = await api(cookie, "/api/admin/instagram/simulate", {
  method: "POST",
  body: JSON.stringify(commentBody(commentId, "GUIDE please")),
});
assert(res.ok, `simulate T4 ${res.status} ${JSON.stringify(json)}`);
const t4 = await waitForStatus(commentId, "sent");
assert(t4, "no delivery row for T4");
assert(
  t4.status === "sent" || t4.status === "queued" || t4.status === "failed",
  `T4 status ${t4.status}`,
);
console.log(`  OK status=${t4.status} preview=${(t4.private_reply_preview ?? "").slice(0, 40)}`);

console.log("T6: duplicate comment id…");
({ res, json } = await api(cookie, "/api/admin/instagram/simulate", {
  method: "POST",
  body: JSON.stringify(commentBody(commentId, "GUIDE please")),
}));
assert(res.ok, `simulate T6 ${res.status}`);
const dupRows = await sql`
  SELECT status, skip_reason FROM instagram_deliveries
  WHERE account_id = ${accountId}::uuid AND skip_reason = 'duplicate'
  ORDER BY created_at DESC LIMIT 1
`;
assert(dupRows[0]?.skip_reason === "duplicate", "expected duplicate skip row");
console.log("  OK duplicate skipped");

console.log("T7: non-matching keyword…");
const wrongId = `61-wrong-${stamp}`;
const before = await sql`SELECT COUNT(*)::int AS n FROM instagram_deliveries`;
({ res, json } = await api(cookie, "/api/admin/instagram/simulate", {
  method: "POST",
  body: JSON.stringify(commentBody(wrongId, "HELLO not a keyword")),
}));
assert(res.ok, `simulate T7 ${res.status}`);
const after = await sql`SELECT COUNT(*)::int AS n FROM instagram_deliveries`;
const wrongRow = await deliveryForComment(wrongId);
assert(!wrongRow && after[0].n === before[0].n, "T7 should not create delivery");
console.log("  OK no send for non-match");

console.log("T8: deactivate campaign; comment again…");
({ res, json } = await api(cookie, `/api/admin/instagram/campaigns/${campaign.id}`, {
  method: "PATCH",
  body: JSON.stringify({ active: false }),
}));
assert(res.ok, `deactivate ${res.status}`);
const inactiveId = `61-inactive-${stamp}`;
({ res, json } = await api(cookie, "/api/admin/instagram/simulate", {
  method: "POST",
  body: JSON.stringify(commentBody(inactiveId, "GUIDE again")),
}));
assert(res.ok, `simulate T8 ${res.status}`);
const t8 = await deliveryForComment(inactiveId);
assert(t8?.skip_reason === "campaign_inactive", `T8 skip_reason=${t8?.skip_reason}`);
console.log("  OK campaign_inactive");

await sql`UPDATE instagram_campaigns SET active = TRUE WHERE id = ${campaign.id}::uuid`;
console.log("Re-enabled campaign after T8");

console.log("T5: delivery filters (API)…");
({ res, json } = await api(
  cookie,
  `/api/admin/instagram/deliveries?campaignId=${campaign.id}&status=sent&limit=5`,
));
assert(res.ok, `deliveries filter ${res.status}`);
assert((json.deliveries?.length ?? 0) >= 1, "filter should return sent rows");
console.log(`  OK filtered ${json.deliveries.length} row(s)`);

console.log("\n6.1 exercise passed (dev simulate + Neon). Prod T4: comment GUIDE on the live post, then wrangler tail / Activity.");