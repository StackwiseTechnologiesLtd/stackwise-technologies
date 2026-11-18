#!/usr/bin/env node
/**
 * Seed content ideas from today through end of December (scripts only — no media).
 * Sets created_at on "work" days before each scheduled_on so the calendar shows
 * creating (solid) vs due (dotted). Safe to re-run — replaces [dec-plan] posts.
 *
 *   npm run content-calendar:plan-december
 *   CONTENT_CALENDAR_PLAN_YEAR=2025 npm run content-calendar:plan-december
 */
import { randomUUID } from "node:crypto";
import process from "node:process";
import { neon } from "@neondatabase/serverless";
import { loadEnvLocal } from "./lib/load-env-local.mjs";

loadEnvLocal();

const PLAN_PREFIX = "[dec-plan]";
const YEAR = Number(process.env.CONTENT_CALENDAR_PLAN_YEAR ?? String(new Date().getFullYear()));

const BRANDS = {
  looial: { accent: "#c9a87c", label: "Looial" },
  stackwise: { accent: "#7038f4", label: "Stackwise" },
};

const CHANNELS = ["instagram", "x", "tiktok"];

const TIMES_TWO = ["10:00", "17:30"];
const TIMES_THREE = ["09:30", "14:00", "18:15"];

const LOOIAL_ANGLES = [
  {
    title: "Morning ritual — 15s hook",
    script:
      "Hook: Split screen — clutter vs calm vanity.\nVO: What if your shelf matched your mood?\nCTA: looial.com — shop the edit.",
    notes: "Visual: soft natural light, product hero on marble. Carousel or Reel.",
  },
  {
    title: "Ingredient transparency",
    script:
      "Hook: 'I stopped guessing what's in my serum.'\n3 beats: label callouts, texture ASMR, before/after (subtle).\nCTA: Link in bio.",
    notes: "Static or carousel — no heavy retouch.",
  },
  {
    title: "Gift guide micro-edit",
    script:
      "Hook: 'Gifts that don't feel last-minute.'\nShow 3 bundles under one aesthetic.\nCTA: Shop the gift edit.",
    notes: "December gifting angle; attach your pack shots when ready.",
  },
  {
    title: "Customer DM → FAQ",
    script:
      "Hook: 'You asked about shipping before the holidays.'\nAnswer in 20s with on-screen text.\nCTA: looial.com/faq",
    notes: "Talking head or text-on-b-roll.",
  },
  {
    title: "Unboxing pacing",
    script:
      "Hook: Satisfying peel + tissue pull (no logo flash first).\nBeat 2: texture close-ups.\nCTA: 'New drops weekly.'",
    notes: "TikTok-native pacing; trending sound optional.",
  },
  {
    title: "Shelfie / restock",
    script:
      "Hook: 'Sunday restock ritual.'\nQuick cuts: wipe, arrange, light a candle.\nCTA: Tag a friend who needs calm.",
    notes: "User-generated style; film on phone.",
  },
];

const STACKWISE_ANGLES = [
  {
    title: "Ship ops in a week — myth vs reality",
    script:
      "Hook: 'We didn't replace your stack overnight.'\n3 truths: ingest → CRM → delivery alerts.\nCTA: DM 'ops' or site CTA.",
    notes: "X thread or IG carousel; attach case study still when ready.",
  },
  {
    title: "Behind the admin portal",
    script:
      "Hook: Screen record — calendar + CRM in one shell.\nVO: How agencies stop context switching.\nCTA: Book a walkthrough.",
    notes: "Blur client data; 45–60s max.",
  },
  {
    title: "Hiring signal — X thread",
    script:
      "1/ Founders hire when delivery breaks, not when design is pretty.\n2/ What we instrument first.\n3/ CTA: cal link.",
    notes: "Thread format; single brand image optional.",
  },
  {
    title: "Integration fabric (plain English)",
    script:
      "Hook: 'One ingest endpoint, many automations.'\nDiagram on screen: webhook → queue → CRM.\nCTA: Read the build plan (link).",
    notes: "Educational; purple accent on diagrams.",
  },
  {
    title: "Content calendar workflow",
    script:
      "Hook: 'Scripts in the sheet, creative in your gallery.'\nShow scrapbook grid + attachment slots empty.\nCTA: How we plan December drops.",
    notes: "Meta post — film the actual calendar UI.",
  },
  {
    title: "Client portal / brand guidelines",
    script:
      "Hook: 'Your brand system, not a PDF graveyard.'\n3 UI beats: tokens, type, usage do/don't.\nCTA: stackwise — agency ops.",
    notes: "Opsis or client-safe redacted preview.",
  },
  {
    title: "Year-end delivery retrospective",
    script:
      "Hook: 'What we shipped in Q4 for partners.'\nBullet milestones (no names) + lesson learned.\nCTA: Reply with your bottleneck.",
    notes: "LinkedIn cross-post optional later — keep channel as scheduled here.",
  },
];

function isoDay(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysDate(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

function parseIsoDay(iso) {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function daysBetween(aIso, bIso) {
  const a = parseIsoDay(aIso);
  const b = parseIsoDay(bIso);
  return Math.round((b - a) / 86_400_000);
}

/** When to show the post on the calendar for creating (solid), not the due day. */
function workOnForScheduled(scheduledIso, todayIso) {
  if (scheduledIso <= todayIso) return todayIso;
  const daysUntil = daysBetween(todayIso, scheduledIso);
  const lead = Math.min(12, Math.max(2, Math.floor(daysUntil * 0.45)));
  const work = addDaysDate(parseIsoDay(scheduledIso), -lead);
  const workIso = isoDay(work);
  return workIso < todayIso ? todayIso : workIso;
}

function workTimestamp(workIso, hour = 9) {
  return `${workIso}T${String(hour).padStart(2, "0")}:00:00.000Z`;
}

function pickSlots(dayIndex) {
  if (dayIndex % 3 === 0) return TIMES_THREE;
  return TIMES_TWO;
}

function planDays() {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(YEAR, 11, 31);
  if (todayStart > end) {
    return { todayIso: isoDay(todayStart), days: [] };
  }
  const start =
    todayStart.getFullYear() === YEAR || todayStart < end
      ? todayStart
      : new Date(YEAR, 11, 1);

  const days = [];
  for (let d = new Date(start); d <= end; d = addDaysDate(d, 1)) {
    days.push(isoDay(d));
  }
  return { todayIso: isoDay(todayStart), days };
}

function buildPosts(todayIso, scheduleDays) {
  const posts = [];
  let globalIndex = 0;

  for (let dayIndex = 0; dayIndex < scheduleDays.length; dayIndex += 1) {
    const scheduledOn = scheduleDays[dayIndex];
    const slots = pickSlots(dayIndex);
    const monthDay = parseIsoDay(scheduledOn).getDate();
    const isDecember = scheduledOn.startsWith(`${YEAR}-12-`);

    for (let slot = 0; slot < slots.length; slot += 1) {
      const brandKey = (dayIndex + slot) % 2 === 0 ? "looial" : "stackwise";
      const brand = BRANDS[brandKey];
      const angles = brandKey === "looial" ? LOOIAL_ANGLES : STACKWISE_ANGLES;
      const angle = angles[(monthDay + slot + globalIndex) % angles.length];
      const channel = CHANNELS[(dayIndex + slot) % CHANNELS.length];
      const daysUntilDue = daysBetween(todayIso, scheduledOn);
      const status =
        daysUntilDue <= 3 ? "scheduled" : daysUntilDue <= 10 ? "draft" : "draft";
      const workOn = workOnForScheduled(scheduledOn, todayIso);
      const title = `${PLAN_PREFIX} ${brand.label} — ${angle.title} (${scheduledOn})`;

      posts.push({
        title,
        scheduledOn,
        workOn,
        createdAt: workTimestamp(workOn, 9 + (globalIndex % 5)),
        time: slots[slot],
        channel,
        status,
        accent: brand.accent,
        script: angle.script,
        notes: `${angle.notes}\nBrand: ${brand.label}. Attach visuals in the post sheet when styles are ready.${
          !isDecember ? "\n(Late Nov ramp — part of December campaign.)" : ""
        }`,
      });
      globalIndex += 1;
    }
  }
  return posts;
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  await sql`DELETE FROM content_calendar_posts WHERE title LIKE ${`${PLAN_PREFIX}%`}`;

  const { todayIso, days: scheduleDays } = planDays();
  if (scheduleDays.length === 0) {
    console.error(`No schedule days: today is after Dec 31 ${YEAR}.`);
    process.exit(1);
  }

  const posts = buildPosts(todayIso, scheduleDays);
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

  const firstDue = scheduleDays[0];
  const lastDue = scheduleDays[scheduleDays.length - 1];
  console.log(
    `Seeded ${inserted} plan post(s) from ${firstDue} → ${lastDue} (work starts ${todayIso}). Prefix: ${PLAN_PREFIX}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});