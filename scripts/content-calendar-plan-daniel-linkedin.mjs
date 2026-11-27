#!/usr/bin/env node
/**
 * Seed Daniel personal LinkedIn posts (scripts only).
 *   npm run content-calendar:plan-daniel-linkedin
 *   CONTENT_CALENDAR_PLAN_DRY=1 npm run content-calendar:plan-daniel-linkedin
 *
 * Brief: docs/engineering/DANIEL_LINKEDIN_CONTENT_BRIEF.md
 */
import { randomUUID } from "node:crypto";
import process from "node:process";
import { neon } from "@neondatabase/serverless";
import { loadEnvLocal } from "./lib/load-env-local.mjs";
import { danielLinkedInPosts } from "./lib/daniel-linkedin-posts.mjs";

loadEnvLocal();

const PLAN_PREFIX = "[daniel-li]";
const ACCENT = "#0a66c2";
const CHANNEL = "linkedin";
const STATUS = "scheduled";
const POST_TIME = "10:00";

/** Tue/Thu slots starting the first Tue on or after tomorrow (or today if Tue). */
function upcomingTueThuSlots(count, fromDate = new Date()) {
  const slots = [];
  const cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  while (slots.length < count) {
    const day = cursor.getDay();
    if (day === 2 || day === 4) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      const d = String(cursor.getDate()).padStart(2, "0");
      slots.push(`${y}-${m}-${d}`);
    }
    cursor.setDate(cursor.getDate() + 1);
    if (slots.length < count && cursor - fromDate > 366 * 86_400_000) break;
  }
  return slots;
}

function isoDay(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIsoDay(iso) {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function addDaysDate(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

function daysBetween(aIso, bIso) {
  const a = parseIsoDay(aIso);
  const b = parseIsoDay(bIso);
  return Math.round((b - a) / 86_400_000);
}

function workOnForScheduled(scheduledIso, todayIso) {
  if (scheduledIso <= todayIso) return todayIso;
  const daysUntil = daysBetween(todayIso, scheduledIso);
  const lead = Math.min(10, Math.max(2, Math.floor(daysUntil * 0.4)));
  const work = addDaysDate(parseIsoDay(scheduledIso), -lead);
  const workIso = isoDay(work);
  return workIso < todayIso ? todayIso : workIso;
}

function workTimestamp(workIso, hour = 9) {
  return `${workIso}T${String(hour).padStart(2, "0")}:00:00.000Z`;
}

async function main() {
  const todayIso = isoDay(new Date());
  const scheduleDays = upcomingTueThuSlots(danielLinkedInPosts.length);

  if (scheduleDays.length < danielLinkedInPosts.length) {
    console.error("Not enough Tue/Thu slots computed");
    process.exit(1);
  }

  const posts = danielLinkedInPosts.map((row, i) => {
    const scheduledOn = scheduleDays[i];
    const workIso = workOnForScheduled(scheduledOn, todayIso);
    const notes = [`${row.audience}`, `Angle: ${row.angle}`, row.notes].filter(Boolean).join("\n");
    return {
      title: `${PLAN_PREFIX} ${row.slug}`,
      scheduledOn,
      time: POST_TIME,
      channel: CHANNEL,
      status: STATUS,
      script: row.script.trim(),
      notes,
      accent: ACCENT,
      createdAt: workTimestamp(workIso),
    };
  });

  if (process.env.CONTENT_CALENDAR_PLAN_DRY === "1") {
    console.log(`Dry run — would insert ${posts.length} ${PLAN_PREFIX} post(s)\n`);
    for (const p of posts) {
      console.log(`  ${p.scheduledOn} ${p.time}  ${p.title}`);
      console.log(`    work created_at ~ ${p.createdAt}`);
    }
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  const manual = await sql`
    SELECT COUNT(*)::int AS n FROM content_calendar_posts
    WHERE title LIKE ${`${PLAN_PREFIX}%`}
      AND updated_at > created_at + interval '2 minutes'
  `;
  if (manual[0]?.n > 0) {
    console.warn(
      `${PLAN_PREFIX} ${manual[0].n} post(s) look hand-edited. Re-run replaces ALL ${PLAN_PREFIX} rows.`,
    );
  }

  await sql`DELETE FROM content_calendar_posts WHERE title LIKE ${`${PLAN_PREFIX}%`}`;

  let inserted = 0;
  for (const p of posts) {
    const id = randomUUID();
    await sql`
      INSERT INTO content_calendar_posts (
        id, title, scheduled_on, scheduled_time, channel, status,
        script, notes, accent, created_at, updated_at
      ) VALUES (
        ${id}::uuid,
        ${p.title},
        ${p.scheduledOn}::date,
        ${p.time},
        ${p.channel},
        ${p.status},
        ${p.script},
        ${p.notes},
        ${p.accent},
        ${p.createdAt}::timestamptz,
        ${p.createdAt}::timestamptz
      )
    `;
    inserted += 1;
  }

  console.log(
    `Seeded ${inserted} Daniel LinkedIn post(s) (${scheduleDays[0]} → ${scheduleDays[scheduleDays.length - 1]}). Prefix: ${PLAN_PREFIX}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});