#!/usr/bin/env node
/**
 * Seed demo content-calendar posts (current month). Safe to re-run — replaces [sample] posts.
 * Uploads real preview images to R2 when S3 credentials or wrangler auth is available.
 */
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";
import { loadEnvLocal } from "./lib/load-env-local.mjs";
import { buildDemoR2Key, putContentCalendarObject } from "./lib/r2-content-calendar.mjs";

loadEnvLocal();

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const DEMO_IMAGES = {
  social: "public/branding/opsis/previews/044b4bf96039d0c0a819-400.webp",
  launch: "public/branding/opsis/previews/3ebe7e302100bb897430-400.webp",
  carousel: "public/branding/opsis/previews/b888a89d234f43a543ed-400.webp",
  tiktok: "public/branding/opsis/previews/a4d14e1ed75cdf980cce-400.webp",
};

function isoDay(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const today = new Date();
const samples = [
  {
    title: "[sample] Paid social creatives",
    offset: 0,
    time: "15:00",
    channel: "instagram",
    status: "scheduled",
    accent: "#e85d8a",
    script: "Hook: New case study drop.\nCTA: Link in bio.",
    notes: "Need vertical + square crops",
    image: DEMO_IMAGES.social,
  },
  {
    title: "[sample] LinkedIn thought piece",
    offset: 2,
    time: "09:30",
    channel: "linkedin",
    status: "draft",
    accent: "#3b82f6",
    script: "3 lessons from shipping agency ops in a week.",
    notes: "",
  },
  {
    title: "[sample] Launch sync",
    offset: -1,
    time: "12:00",
    channel: "instagram",
    status: "published",
    accent: "#e85d8a",
    script: "Behind the scenes — client portal walkthrough.",
    notes: "Posted from phone",
    image: DEMO_IMAGES.launch,
  },
  {
    title: "[sample] X thread — hiring",
    offset: 4,
    time: null,
    channel: "x",
    status: "draft",
    accent: "#a855f7",
    script: "1/ We help founders ship…",
    notes: "Thread + CTA to cal.com",
  },
  {
    title: "[sample] TikTok BTS",
    offset: 7,
    time: "18:00",
    channel: "tiktok",
    status: "scheduled",
    accent: "#f97316",
    script: "Office day / desk setup",
    notes: "Use trending audio",
    image: DEMO_IMAGES.tiktok,
  },
  {
    title: "[sample] Case study carousel",
    offset: 10,
    time: "11:00",
    channel: "instagram",
    status: "scheduled",
    accent: "#e85d8a",
    script: "Slide 1: problem\nSlide 5: results",
    notes: "Attach polaroid still",
    image: DEMO_IMAGES.carousel,
  },
];

async function insertAsset(postId, relImagePath) {
  const abs = path.join(repoRoot, relImagePath);
  if (!fs.existsSync(abs)) {
    console.warn(`Skip missing image: ${relImagePath}`);
    return;
  }
  const assetId = randomUUID();
  const filename = path.basename(abs);
  const contentType = filename.endsWith(".webp") ? "image/webp" : "image/png";
  const byteSize = fs.statSync(abs).size;

  let r2Key = null;
  let devData = null;

  const fileBytes = fs.readFileSync(abs);
  r2Key = buildDemoR2Key(postId, assetId, filename);
  try {
    const put = await putContentCalendarObject(r2Key, abs, contentType);
    console.log(`  ↑ R2 (${put.via}): ${r2Key}`);
  } catch (err) {
    console.warn(`  R2 upload failed for ${filename}, dev_data only:`, err.message);
    r2Key = null;
  }
  // Mirror bytes in Neon so `next dev` still shows thumbs if S3 env is not set yet.
  if (!process.env.CONTENT_CALENDAR_SEED_NO_DEV_DATA) {
    devData = fileBytes;
  }

  await sql`
    INSERT INTO content_calendar_assets (
      id, post_id, r2_key, content_type, filename, byte_size, sort_order, dev_data
    ) VALUES (
      ${assetId}::uuid,
      ${postId}::uuid,
      ${r2Key},
      ${contentType},
      ${filename},
      ${byteSize},
      0,
      ${devData}
    )
  `;
}

async function main() {
  await sql`DELETE FROM content_calendar_posts WHERE title LIKE '[sample]%'`;

  let inserted = 0;
  for (const s of samples) {
    const id = randomUUID();
    const scheduledOn = isoDay(addDays(today, s.offset));
    await sql`
      INSERT INTO content_calendar_posts (
        id, title, scheduled_on, scheduled_time, channel, status,
        script, notes, accent, updated_at
      ) VALUES (
        ${id}::uuid,
        ${s.title},
        ${scheduledOn}::date,
        ${s.time},
        ${s.channel},
        ${s.status},
        ${s.script},
        ${s.notes},
        ${s.accent},
        NOW()
      )
    `;
    inserted += 1;
    if (s.image) {
      console.log(s.title);
      await insertAsset(id, s.image);
    }
  }

  console.log(`Seeded ${inserted} sample content-calendar post(s) for ${isoDay(today).slice(0, 7)}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});