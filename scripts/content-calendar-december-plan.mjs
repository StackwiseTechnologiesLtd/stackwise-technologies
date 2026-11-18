#!/usr/bin/env node
/**
 * Seed December content ideas (scripts only — no media). Safe to re-run — replaces [dec-plan] posts.
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
const YEAR = Number(process.env.CONTENT_CALENDAR_PLAN_YEAR ?? "2026");
const MONTH = 12;
const DAYS_IN_MONTH = 31;

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

function isoDay(year, month, day) {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function pickSlots(day) {
  if (day % 3 === 0) return TIMES_THREE;
  return TIMES_TWO;
}

function buildPosts() {
  const posts = [];
  let globalIndex = 0;

  for (let day = 1; day <= DAYS_IN_MONTH; day += 1) {
    const slots = pickSlots(day);
    for (let slot = 0; slot < slots.length; slot += 1) {
      const brandKey = (day + slot) % 2 === 0 ? "looial" : "stackwise";
      const brand = BRANDS[brandKey];
      const angles = brandKey === "looial" ? LOOIAL_ANGLES : STACKWISE_ANGLES;
      const angle = angles[(day + slot + globalIndex) % angles.length];
      const channel = CHANNELS[(day + slot) % CHANNELS.length];
      const status = day <= 7 ? "scheduled" : "draft";
      const title = `${PLAN_PREFIX} ${brand.label} — ${angle.title} (${isoDay(YEAR, MONTH, day)})`;

      posts.push({
        title,
        scheduledOn: isoDay(YEAR, MONTH, day),
        time: slots[slot],
        channel,
        status,
        accent: brand.accent,
        script: angle.script,
        notes: `${angle.notes}\nBrand: ${brand.label}. Attach visuals in the post sheet when styles are ready.`,
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

  const posts = buildPosts();
  let inserted = 0;

  for (const p of posts) {
    const id = randomUUID();
    await sql`
      INSERT INTO content_calendar_posts (
        id, title, scheduled_on, scheduled_time, channel, status,
        script, notes, accent, updated_at
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
        NOW()
      )
    `;
    inserted += 1;
  }

  const slotsPerDay =
    posts.length / DAYS_IN_MONTH >= 2.9 ? "~3 on every 3rd day, else 2" : "2";
  console.log(
    `Seeded ${inserted} December ${YEAR} plan post(s) (${slotsPerDay}/day). Prefix: ${PLAN_PREFIX}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});