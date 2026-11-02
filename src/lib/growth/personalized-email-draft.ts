import { bookingUrl } from "@/lib/booking";
import { buildReplyDraft, firstName } from "@/lib/growth/drafts";
import { growthAiLog } from "@/lib/growth/ai-debug";
import { isOpenRouterConfigured, openRouterChat, openRouterModel } from "@/lib/growth/openrouter";
import {
  normalizeDiscoveryKeyword,
  type PersonalizedDraftInput,
} from "@/lib/growth/personalized-draft";

export type PersonalizedEmailDraft = {
  subject: string;
  body: string;
  usedAi: boolean;
  aiError?: string;
};

function topicFromPost(bodyText: string): string {
  const line =
    bodyText
      .trim()
      .split(/\n/)
      .map((l) => l.trim())
      .find((l) => l.length >= 12) ?? bodyText.trim();
  return line.slice(0, 80).replace(/\s+/g, " ");
}

function buildFallbackEmail(input: PersonalizedDraftInput): PersonalizedEmailDraft {
  const name = firstName(input.authorName);
  const topic = topicFromPost(input.bodyText || input.roleTitle || "your product work");
  const body = buildReplyDraft({
    authorName: input.authorName,
    bodyText: input.bodyText || `Role: ${input.roleTitle ?? "founder"}`,
    platform: "linkedin",
  });
  return {
    subject: `${name}, quick note on ${topic}`,
    body,
    usedAi: false,
  };
}

function parseEmailDraft(raw: string, fallback: PersonalizedEmailDraft): PersonalizedEmailDraft {
  const subjectMatch = raw.match(/^SUBJECT:\s*(.+)$/im);
  const bodyMatch = raw.match(/\nBODY:\s*\n([\s\S]+)$/i) ?? raw.match(/^BODY:\s*\n([\s\S]+)$/im);
  if (subjectMatch && bodyMatch) {
    return {
      subject: subjectMatch[1].trim().slice(0, 200),
      body: bodyMatch[1].trim(),
      usedAi: true,
    };
  }
  const lines = raw.trim().split(/\n/);
  if (lines.length >= 2 && lines[0].toLowerCase().startsWith("subject:")) {
    return {
      subject: lines[0].replace(/^subject:\s*/i, "").trim().slice(0, 200),
      body: lines.slice(1).join("\n").trim(),
      usedAi: true,
    };
  }
  return { ...fallback, body: raw.trim() || fallback.body, usedAi: true };
}

function minScoreForAiDraft(): number {
  const raw = process.env.GROWTH_MIN_DRAFT_SCORE?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 42;
  return Number.isFinite(n) ? n : 42;
}

export async function buildPersonalizedEmailDraft(
  input: PersonalizedDraftInput,
): Promise<PersonalizedEmailDraft> {
  const fallback = buildFallbackEmail(input);
  const discoveryKeyword = normalizeDiscoveryKeyword(input.contextSummary);

  if (!input.skipScoreThreshold && input.compositeScore < minScoreForAiDraft()) {
    return fallback;
  }

  if (!isOpenRouterConfigured()) {
    return { ...fallback, aiError: "OPENROUTER_API_KEY not configured" };
  }

  const name = firstName(input.authorName);
  const booking = bookingUrl();

  const webDesignContext =
    input.skipScoreThreshold &&
    /website|landing page|rebrand|web design|ui\/ux|ux design|wordpress|redesign/i.test(
      `${input.contextSummary ?? ""}\n${input.bodyText ?? ""}`,
    );

  const system = webDesignContext
    ? `You write short cold emails for Stackwise Technologies — we design and build websites, landing pages, and product UI for founders and small teams (clear brand, fast turnaround, production-ready).

Rules:
- Write to a specific person using details from the page content (their business, project, or stated need for a site or redesign).
- 3–5 short paragraphs; plain language; no "Hope this finds you well"; no hashtags.
- One clear subject line (specific, not spammy).
- One soft CTA with the booking link exactly once at the end of the body.
- Do not invent facts not in the context.
- Never mention ICP, keyword search, Firecrawl, or how we found them.

OUTPUT FORMAT (exactly):
SUBJECT: <one line>
BODY:
<email body>`
    : `You write short cold emails for Stackwise Technologies — we help founders and product leaders take fast-built MVPs to production (engineering, cloud, UX) without throwing away what already works.

Rules:
- Write to a specific person using details from their post and profile research.
- 3–5 short paragraphs; plain language; no "Hope this finds you well"; no hashtags.
- One clear subject line (specific, not spammy).
- One soft CTA with the booking link exactly once at the end of the body.
- Do not invent facts not in the context.
- Never mention ICP, keyword search, or how we found them.

OUTPUT FORMAT (exactly):
SUBJECT: <one line>
BODY:
<email body>`;

  const user = `Person: ${input.authorName}
Role: ${input.roleTitle ?? "unknown"}
Company: ${input.companyName ?? "unknown"}

Profile research:
${input.profileSummary?.trim() || "Use only the post."}

Their post or signal:
${(input.bodyText || "(no post body stored)").slice(0, 1500)}
${
  discoveryKeyword
    ? `\n(Internal — never mention: keyword "${discoveryKeyword}".)`
    : ""
}

Lead fit: ${input.compositeScore}/100
Booking link for body: ${booking}

Write the cold email to ${name}.`;

  growthAiLog("Drafting outreach email with OpenRouter", {
    author: input.authorName,
    model: openRouterModel(),
  });

  const result = await openRouterChat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { maxTokens: 650, temperature: 0.65 },
  );

  if ("error" in result) {
    return { ...fallback, aiError: result.error };
  }

  let parsed = parseEmailDraft(result.text, fallback);
  if (!parsed.body.includes("cal.com") && !parsed.body.includes(booking)) {
    parsed = { ...parsed, body: `${parsed.body.trim()}\n\n${booking}` };
  }
  return parsed;
}
