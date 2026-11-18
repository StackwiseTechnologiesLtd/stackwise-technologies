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

/**
 * Fixed + generated celebration hooks (new month, retail moments, Christmas countdown, public days).
 * Key = scheduled_on (YYYY-MM-DD). First slot(s) on that day use these instead of rotating angles.
 */
function celebrationMomentsByDate(year) {
  /** @type {Map<string, Array<{ brandKey: keyof typeof BRANDS; title: string; script: string; notes: string; channel?: string; time?: string }>>} */
  const map = new Map();

  const set = (iso, entries) => map.set(iso, entries);

  const pad = (m, d) => `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  set(pad(11, 28), [
    {
      brandKey: "looial",
      title: "Black Friday — giftable edits",
      channel: "instagram",
      time: "09:00",
      script:
        "Hook: 'The edit that actually ships before the weekend.'\n3 hero SKUs + limited window.\nCTA: looial.com — Black Friday lane.",
      notes: "Celebration: retail moment. Bold type + sale end time on slide 1.",
    },
    {
      brandKey: "stackwise",
      title: "Black Friday — founder ops bundle",
      channel: "x",
      time: "14:00",
      script:
        "Hook: 'Not a discount — a deadline to fix delivery before January.'\n1/ What we bundle in Q4 ops.\n2/ Who it's for.\nCTA: DM audit.",
      notes: "Celebration: B2B angle on retail weekend.",
    },
  ]);

  set(pad(11, 29), [
    {
      brandKey: "looial",
      title: "Small Business Saturday — maker story",
      channel: "instagram",
      script:
        "Hook: Behind the shelf — who makes the edit.\nVO: Small batch, intentional restocks.\nCTA: Shop small / share a shelfie.",
      notes: "Celebration: Small Business Saturday.",
    },
  ]);

  set(pad(11, 30), [
    {
      brandKey: "stackwise",
      title: "Cyber Monday — systems check",
      channel: "linkedin",
      script:
        "Hook: 'Your checkout survived Monday.traffic?'\nQuick checklist: payments, CRM capture, receipt email.\nCTA: Stackwise ops.",
      notes: "Celebration: Cyber Monday. Cross-post to X if needed.",
    },
    {
      brandKey: "looial",
      title: "November close — December preview",
      channel: "tiktok",
      script:
        "Hook: December moodboard in 15s.\nTease: gifts, rituals, countdown.\nCTA: Follow for Dec drops.",
      notes: "Celebration: month transition tease before Dec 1 welcome.",
    },
  ]);

  set(pad(12, 1), [
    {
      brandKey: "looial",
      title: "Welcome December — new month",
      channel: "instagram",
      time: "08:30",
      script:
        "Hook: 'December is a vibe, not a scramble.'\nWelcome: gifting + slow rituals.\nCTA: Save for the December edit.",
      notes: "Celebration: new month welcome. Cozy palette; pin to profile optional.",
    },
    {
      brandKey: "stackwise",
      title: "Welcome December — delivery sprint",
      channel: "x",
      time: "09:00",
      script:
        "Hook: 'Last month of the year — what still has to ship?'\n3 priorities for agency & product teams.\nCTA: Reply with your #1 deliverable.",
      notes: "Celebration: new month welcome for B2B.",
    },
  ]);

  set(pad(12, 2), [
    {
      brandKey: "stackwise",
      title: "Giving Tuesday — partner shoutout",
      channel: "linkedin",
      script:
        "Hook: 'Grateful for teams that shipped with us this year.'\nTag 2 partners (with permission) + one lesson learned.\nCTA: None hard — goodwill.",
      notes: "Celebration: Giving Tuesday.",
    },
  ]);

  set(pad(12, 12), [
    {
      brandKey: "stackwise",
      title: "Jamhuri Day — Kenya builds",
      channel: "x",
      script:
        "Hook: 'Building from here, for here.'\nShort nod to Jamhuri Day + local delivery wins.\nCTA: Kenya founders — DM if ops is the bottleneck.",
      notes: "Celebration: Kenya Jamhuri Day (public). Keep respectful, not promo-heavy.",
    },
    {
      brandKey: "looial",
      title: "Jamhuri Day — local ritual",
      channel: "instagram",
      script:
        "Hook: Kenyan-made calm — shelf ritual at home.\nSoft patriot tone; product secondary.\nCTA: looial.com",
      notes: "Celebration: Jamhuri Day. Avoid flag clutter unless brand-appropriate.",
    },
  ]);

  for (let day = 13; day <= 24; day += 1) {
    const daysLeft = 25 - day;
    const iso = pad(12, day);
    const brandKey = day % 2 === 0 ? "looial" : "stackwise";
    const label = daysLeft === 0 ? "Christmas Eve eve" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} to Christmas`;
    set(iso, [
      {
        brandKey,
        title: `Christmas countdown — ${label}`,
        channel: brandKey === "looial" ? "instagram" : "x",
        time: "18:00",
        script:
          brandKey === "looial"
            ? `Hook: On-screen tally — ${label}.\n1 giftable idea + 1 self-care beat.\nCTA: looial.com gift edit.`
            : `Hook: ${label} — what's still in the sprint queue?\n1 tip to ship before holidays.\nCTA: Stackwise calendar workflow.`,
        notes: `Celebration: Christmas countdown (${label}). Number graphic or handwritten tally.`,
      },
    ]);
  }

  set(pad(12, 24), [
    {
      brandKey: "looial",
      title: "Christmas Eve — last orders & warmth",
      channel: "instagram",
      time: "12:00",
      script:
        "Hook: Eve light, soft VO.\nShipping cutoff reminder + gratitude.\nCTA: Stories for last-minute links.",
      notes: "Celebration: Christmas Eve.",
    },
    {
      brandKey: "stackwise",
      title: "Christmas Eve — team pause",
      channel: "x",
      script:
        "Hook: 'Logging off — what we shipped in December.'\n3 bullets, no vanity metrics.\nCTA: See you after the break.",
      notes: "Celebration: Christmas Eve. Human tone.",
    },
  ]);

  set(pad(12, 25), [
    {
      brandKey: "looial",
      title: "Christmas Day — gratitude post",
      channel: "instagram",
      time: "10:00",
      script:
        "Hook: Still frame + one line of thanks.\nNo hard sell — brand warmth only.\nCTA: Optional 'shop when ready' in bio.",
      notes: "Celebration: Christmas Day. Minimal copy.",
    },
    {
      brandKey: "stackwise",
      title: "Christmas Day — quiet",
      channel: "x",
      script:
        "Hook: 'Merry Christmas from the Stackwise desk.'\nSingle image or text-only.\nCTA: None.",
      notes: "Celebration: Christmas Day.",
    },
  ]);

  set(pad(12, 26), [
    {
      brandKey: "looial",
      title: "Boxing Day — unbox & restock",
      channel: "tiktok",
      script:
        "Hook: Boxing Day shelf reset.\nASMR organize + what we're restocking.\nCTA: looial.com",
      notes: "Celebration: Boxing Day / post-Christmas retail.",
    },
  ]);

  set(pad(12, 31), [
    {
      brandKey: "looial",
      title: "New Year's Eve — December thank-you",
      channel: "instagram",
      time: "17:00",
      script:
        "Hook: 'December, you were a lot.'\nMontage of posts/rituals (use your attachments).\nCTA: What are you bringing into January?",
      notes: "Celebration: New Year's Eve / year close.",
    },
    {
      brandKey: "stackwise",
      title: "New Year's Eve — 2027 ops intention",
      channel: "x",
      time: "19:00",
      script:
        "Hook: One ops intention for January (not 12 resolutions).\nPoll: CRM, payments, or content ops first?\nCTA: Reply — we'll share the playbook.",
      notes: "Celebration: New Year's Eve. Year = year+1 of campaign year.",
    },
  ]);

  return map;
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

function postFromCelebration(celebration, scheduledOn, todayIso, time, globalIndex) {
  const brand = BRANDS[celebration.brandKey];
  const daysUntilDue = daysBetween(todayIso, scheduledOn);
  const status = daysUntilDue <= 3 ? "scheduled" : "draft";
  const workOn = workOnForScheduled(scheduledOn, todayIso);
  const isDecember = scheduledOn.startsWith(`${YEAR}-12-`);
  return {
    title: `${PLAN_PREFIX} ${brand.label} — ${celebration.title} (${scheduledOn})`,
    scheduledOn,
    workOn,
    createdAt: workTimestamp(workOn, 9 + (globalIndex % 5)),
    time: celebration.time ?? time,
    channel: celebration.channel ?? CHANNELS[globalIndex % CHANNELS.length],
    status,
    accent: brand.accent,
    script: celebration.script,
    notes: `${celebration.notes}\nBrand: ${brand.label}. Celebration / moment marketing — attach on-brand visuals.${
      !isDecember ? "\n(Late Nov ramp — part of December campaign.)" : ""
    }`,
  };
}

function buildPosts(todayIso, scheduleDays) {
  const posts = [];
  let globalIndex = 0;
  const celebrations = celebrationMomentsByDate(YEAR);

  for (let dayIndex = 0; dayIndex < scheduleDays.length; dayIndex += 1) {
    const scheduledOn = scheduleDays[dayIndex];
    const slots = pickSlots(dayIndex);
    const monthDay = parseIsoDay(scheduledOn).getDate();
    const isDecember = scheduledOn.startsWith(`${YEAR}-12-`);
    const dayCelebrations = celebrations.get(scheduledOn) ?? [];

    for (let slot = 0; slot < slots.length; slot += 1) {
      const celebration = dayCelebrations[slot];
      if (celebration) {
        posts.push(
          postFromCelebration(celebration, scheduledOn, todayIso, slots[slot], globalIndex),
        );
        globalIndex += 1;
        continue;
      }

      const brandKey = (dayIndex + slot) % 2 === 0 ? "looial" : "stackwise";
      const brand = BRANDS[brandKey];
      const angles = brandKey === "looial" ? LOOIAL_ANGLES : STACKWISE_ANGLES;
      const angle = angles[(monthDay + slot + globalIndex) % angles.length];
      const channel = CHANNELS[(dayIndex + slot) % CHANNELS.length];
      const daysUntilDue = daysBetween(todayIso, scheduledOn);
      const status = daysUntilDue <= 3 ? "scheduled" : "draft";
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