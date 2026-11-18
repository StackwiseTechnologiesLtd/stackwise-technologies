#!/usr/bin/env node
/**
 * Seed demo content-calendar posts (current month). Safe to re-run — replaces [sample] posts.
 */
import { randomUUID } from "node:crypto";
import process from "node:process";
import { neon } from "@neondatabase/serverless";
import { loadEnvLocal } from "./lib/load-env-local.mjs";

loadEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

/** 1×1 PNG (warm accent) for dev_data demo */
const DEMO_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

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
    withImage: true,
  },
];

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

    if (s.withImage) {
      const assetId = randomUUID();
      await sql`
        INSERT INTO content_calendar_assets (
          id, post_id, r2_key, content_type, filename, byte_size, sort_order, dev_data
        ) VALUES (
          ${assetId}::uuid,
          ${id}::uuid,
          NULL,
          'image/png',
          'sample-thumb.png',
          ${DEMO_PNG.byteLength},
          0,
          ${DEMO_PNG}
        )
      `;
    }
  }

  console.log(`Seeded ${inserted} sample content-calendar post(s) for ${isoDay(today).slice(0, 7)}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});