#!/usr/bin/env node
/**
 * Phase 6.1 setup: verify webhook, ensure GUIDE comment campaign on active account.
 *
 *   node scripts/instagram-61-setup.mjs
 *   INSTAGRAM_61_MEDIA_ID=1792… node scripts/instagram-61-setup.mjs
 *
 * Uses DATABASE_URL + optional INSTAGRAM_ACCESS_TOKEN_LOOIAL from .env.local.
 */
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { loadEnvLocal } from "./lib/load-env-local.mjs";
import { neon } from "@neondatabase/serverless";

loadEnvLocal();

const GRAPH = (
  process.env.META_GRAPH_API_VERSION?.trim() ||
  process.env.INSTAGRAM_GRAPH_API_VERSION?.trim() ||
  "v21.0"
);
const PROD_HOST = (
  process.env.INSTAGRAM_61_WEBHOOK_HOST?.trim() ||
  "https://stackwisetechnologies.com"
).replace(/\/$/, "");

async function probeWebhook(slug, verifyToken) {
  const challenge = `61-setup-${Date.now()}`;
  const url = new URL(`${PROD_HOST}/api/webhooks/meta/${slug}`);
  url.searchParams.set("hub.mode", "subscribe");
  url.searchParams.set("hub.verify_token", verifyToken);
  url.searchParams.set("hub.challenge", challenge);
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  const body = await res.text();
  return { ok: res.ok && body === challenge, status: res.status, body: body.slice(0, 80) };
}

async function fetchRecentMedia(igUserId, token) {
  const url = new URL(`https://graph.instagram.com/${GRAPH}/${igUserId}/media`);
  url.searchParams.set(
    "fields",
    "id,caption,media_type,permalink,timestamp",
  );
  url.searchParams.set("limit", "8");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(60_000),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message ?? `Graph media ${res.status}`);
  }
  return (json.data ?? []).filter((m) => m.media_type !== "VIDEO" || m.id);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  const apps = await sql`
    SELECT id, slug, label, webhook_verify_token
    FROM instagram_meta_apps
    ORDER BY created_at DESC
  `;
  const app = apps.find((a) => a.slug === "looial-ig") ?? apps[0];
  if (!app) {
    console.error("No instagram_meta_apps row — complete T2 in admin first.");
    process.exit(1);
  }

  const verify = await probeWebhook(app.slug, app.webhook_verify_token);
  console.log(
    verify.ok
      ? `T1 webhook verify: OK (${app.slug})`
      : `T1 webhook verify: FAIL ${verify.status} body=${verify.body}`,
  );

  const accounts = await sql`
    SELECT id, username, ig_user_id, webhook_subscribed, status
    FROM instagram_accounts
    WHERE meta_app_id = ${app.id}::uuid
    ORDER BY created_at
  `;
  const active = accounts.filter((a) => a.status === "active");
  console.log("\nAccounts:");
  for (const a of accounts) {
    console.log(
      `  @${a.username ?? "?"} status=${a.status} webhooks=${a.webhook_subscribed}`,
    );
  }
  const primary =
    active.find((a) => a.username === "loo.ial") ?? active[0];
  if (!primary) {
    console.error("\nNo active IG account — reconnect at /admin/instagram/connection");
    process.exit(1);
  }
  console.log(`\nT2: using @${primary.username} (${primary.id})`);

  let mediaId = process.env.INSTAGRAM_61_MEDIA_ID?.trim() ?? "";
  const token = process.env.INSTAGRAM_ACCESS_TOKEN_LOOIAL?.trim();

  if (!mediaId) {
    const pick = spawnSync(
      "npx",
      ["tsx", "scripts/instagram-61-fetch-media.ts"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          INSTAGRAM_61_ACCOUNT_ID: primary.id,
          INSTAGRAM_61_IG_USER_ID: primary.ig_user_id,
        },
        encoding: "utf8",
      },
    );
    const first = (pick.stdout ?? "")
      .split("\n")
      .map((l) => l.trim())
      .find((l) => /^\d+\t/.test(l));
    if (first) mediaId = first.split("\t")[0];
  }

  if (!mediaId && token) {
    try {
      const posts = await fetchRecentMedia(primary.ig_user_id, token);
      const imagePosts = posts.filter((p) =>
        ["IMAGE", "CAROUSEL_ALBUM"].includes(String(p.media_type)),
      );
      if (imagePosts[0]?.id) {
        mediaId = String(imagePosts[0].id);
        console.log("\nRecent post (auto-picked newest image/carousel):");
        for (const p of imagePosts.slice(0, 3)) {
          const cap = (p.caption ?? "").replace(/\s+/g, " ").slice(0, 60);
          console.log(`  ${p.id}  ${p.media_type}  ${cap || "(no caption)"}`);
          if (p.permalink) console.log(`    ${p.permalink}`);
        }
      }
    } catch (e) {
      console.warn("\nCould not list media from Graph:", e.message);
      console.warn("Set INSTAGRAM_61_MEDIA_ID=… or create campaign in admin.");
    }
  }

  const existing = await sql`
    SELECT id, name, keyword, active, media_id, trigger_type
    FROM instagram_campaigns
    WHERE account_id = ${primary.id}::uuid
    ORDER BY created_at DESC
  `;
  const guide = existing.find(
    (c) =>
      c.trigger_type === "comment" &&
      c.keyword?.toUpperCase() === "GUIDE" &&
      c.media_id,
  );

  if (guide?.active && guide.media_id) {
    console.log(`\nT3: GUIDE comment campaign already active (media ${guide.media_id})`);
  } else if (mediaId) {
    const campaignId = randomUUID();
    await sql`
      INSERT INTO instagram_campaigns (
        id, account_id, name, media_id, keyword, trigger_type,
        private_reply_template, public_reply_template, active
      ) VALUES (
        ${campaignId}::uuid,
        ${primary.id}::uuid,
        ${"6.1 sign-off GUIDE"},
        ${mediaId},
        ${"GUIDE"},
        ${"comment"},
        ${"Hey {username}! Thanks for commenting — learn more at looial.com"},
        ${null},
        ${true}
      )
    `;
    console.log(`\nT3: created GUIDE comment campaign on media ${mediaId}`);
  } else {
    console.log("\nT3: BLOCKED — set INSTAGRAM_61_MEDIA_ID or fix Graph token to auto-pick a post.");
    process.exit(1);
  }

  const mediaForTest =
    guide?.media_id ?? mediaId;
  console.log("\n--- Manual (you) ---");
  console.log("T4: From a second IG account, comment GUIDE on the post for media id:");
  console.log(`    ${mediaForTest}`);
  console.log("    Then check: /admin/instagram/activity");
  console.log("T5–T8: delivery log filters + duplicate + wrong keyword + deactivate campaign");
  console.log("T9: lastWebhookAt / lastSendAt on Growth integrations strip");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});