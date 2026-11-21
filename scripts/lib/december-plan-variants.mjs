/** Unique rotating copy for dec-plan posts (not celebrations). See LOOIAL_CONTENT_BRIEF.md */

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function shortDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function channelNotes(channel) {
  if (channel === "tiktok") return "Format: 9:16, under 25s, text-on-screen hooks.";
  if (channel === "x") return "Format: thread (3–5) or single post with diagram.";
  return "Format: carousel (3–5 slides) or 30–45s Reel.";
}

function pick(arr, index) {
  return arr[((index % arr.length) + arr.length) % arr.length];
}

const LOOIAL_SCENES = [
  "cafe counter at open",
  "salon chair between clients",
  "bookshop till queue",
  "restaurant lunch rush",
  "bakery display case",
  "barber wait area",
  "boutique fitting room",
  "pharmacy pickup window",
];

const LOOIAL_BEATS = [
  "Show QR static at eye level — one scan, WhatsApp opens, enrol sent.",
  "Cut to stamp notification landing in chat — progress bar visible.",
  "Staff finds customer by last 4 digits of phone — one tap, visit logged.",
  "Overlay: 0 app store downloads required.",
  "Customer shows Wallet pass as backup while WhatsApp stays primary.",
  "Referral link shared in-chat — friend joins, both get stamp credit.",
  "Merchant sets reward: '5 visits = free coffee' — show rule on screen.",
  "Near-reward automation ping: '2 stamps to your pastry.'",
];

const LOOIAL_HOOKS = [
  "Your regulars already have WhatsApp open — meet them there.",
  "Paper punch cards don't survive December pockets.",
  "The second visit is harder than the first unless you make it frictionless.",
  "Lunch rush isn't the time to flip through a notebook.",
  "Holiday strangers become January regulars only if you capture them now.",
  "Loyalty apps die in 30 days — chats don't.",
  "You set the reward; they see progress every visit.",
  "Every customer gets a referral link — word of mouth, tracked.",
  "Priced in your currency — no surprise FX on SaaS bills.",
  "One Looial card works across merchants — your shop adds one scan.",
];

const LOOIAL_CTAS = [
  "looial.com — Start Free (7-day trial, no card).",
  "merchant.looial.com — set your reward in 5 minutes.",
  "looial.com/features — see referrals + automations.",
  "looial.com — See Demo (enrolment flow).",
  "@trylooial on X — DM 'demo' for a walkthrough.",
];

export function looialRotatingPost(sequence, { scheduledOn, channel }) {
  const d = new Date(scheduledOn + "T12:00:00");
  const weekday = WEEKDAYS[d.getDay()];
  const scene = pick(LOOIAL_SCENES, sequence + d.getDate());
  const hook = pick(LOOIAL_HOOKS, sequence);
  const beat = pick(LOOIAL_BEATS, sequence + channel.length);
  const cta = pick(LOOIAL_CTAS, Math.floor(sequence / 2));

  const title = `Merchant loyalty · ${weekday} ${shortDate(scheduledOn)} (#${sequence + 1})`;
  const script = [
    `Hook: ${weekday} at the ${scene}.`,
    hook,
    beat,
    `CTA: ${cta}`,
  ].join("\n");

  return {
    title,
    script,
    notes: `${channelNotes(channel)} Looial = WhatsApp-first loyalty for local SMBs.`,
  };
}

const STACKWISE_SCENES = [
  "agency morning standup",
  "client delivery review",
  "integration smoke test",
  "invoice + payment link check",
  "CRM pipeline drag",
  "content calendar planning block",
  "growth connector harvest",
  "contract e-sign status",
  "admin portal screen record",
  "year-end ops retro",
];

const STACKWISE_HOOKS = [
  "Agencies lose hours to context switching — one admin shell helps.",
  "Ingest once: webhooks, queues, CRM rows — same pattern every integration.",
  "Scripts live in the calendar; pixels live in your gallery — separate concerns.",
  "Delivery breaks before design does — instrument ops first.",
  "Phase-gated integrations beat big-bang rewrites.",
  "Brand guidelines belong in a living portal, not a buried PDF.",
  "Manual payment + receipt flow beats 'did they pay?' DMs.",
  "Instagram delivery logs are how you trust automations in prod.",
  "Projects, CRM, and calendar on one Worker — fewer tabs.",
  "Your bottleneck isn't ideas — it's what still has to ship before the holidays.",
];

const STACKWISE_BEATS = [
  "Screen record: blur client data; show the real workflow end-to-end.",
  "Diagram: webhook → queue → Neon row → admin alert.",
  "3 bullets, no vanity metrics — what shipped and what broke.",
  "Plain English: what the client sees vs what we run in Cloudflare.",
  "Call out one lesson from a recent delivery (no client names).",
  "Show pagination + Stackwise selects — boring UI that saves time.",
  "Tie post to a build-plan phase you're signing off this week.",
  "Invite reply with their ops bottleneck — seed next content.",
];

const STACKWISE_CTAS = [
  "stackwisetechnologies.com — agency ops.",
  "Reply/DM 'ops' for a delivery walkthrough.",
  "Book a call — link in bio.",
  "Read INTEGRATIONS_BUILD_PLAN (internal link in notes).",
];

export function stackwiseRotatingPost(sequence, { scheduledOn, channel }) {
  const d = new Date(scheduledOn + "T12:00:00");
  const weekday = WEEKDAYS[d.getDay()];
  const scene = pick(STACKWISE_SCENES, sequence + d.getDate());
  const hook = pick(STACKWISE_HOOKS, sequence);
  const beat = pick(STACKWISE_BEATS, sequence + d.getMonth());
  const cta = pick(STACKWISE_CTAS, Math.floor(sequence / 3));

  const title = `Agency ops · ${weekday} ${shortDate(scheduledOn)} (#${sequence + 1})`;
  const script = [
    `Hook: ${weekday} — ${scene}.`,
    hook,
    beat,
    `CTA: ${cta}`,
  ].join("\n");

  return {
    title,
    script,
    notes: `${channelNotes(channel)} Stackwise delivery + admin platform.`,
  };
}