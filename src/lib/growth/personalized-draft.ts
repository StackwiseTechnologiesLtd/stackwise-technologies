import { bookingUrl } from "@/lib/booking";
import { buildReplyDraft, firstName } from "@/lib/growth/drafts";
import { growthAiLog, growthAiLogMultiline } from "@/lib/growth/ai-debug";
import { isOpenRouterConfigured, openRouterChat, openRouterModel } from "@/lib/growth/openrouter";
import {
  finalizeReplyForPlatform,
  shortBookingUrlForX,
  X_REPLY_MAX_LENGTH,
} from "@/lib/growth/x-reply-format";
import type { GrowthPlatform, IcpConfig } from "@/lib/growth/types";

export type PersonalizedDraftInput = {
  platform: GrowthPlatform;
  authorName: string;
  roleTitle?: string | null;
  companyName?: string | null;
  bodyText: string;
  contextSummary?: string | null;
  profileSummary?: string | null;
  compositeScore: number;
  scoreReasons: string[];
  config: IcpConfig;
};

/** Admin-only metadata (e.g. harvest keyword). Never surface in reply copy. */
export function normalizeDiscoveryKeyword(
  contextSummary?: string | null,
): string | null {
  if (!contextSummary?.trim()) return null;
  let text = contextSummary.trim();
  const lower = text.toLowerCase();
  if (lower.startsWith("icp search:")) {
    text = text.slice("icp search:".length).trim();
  }
  return text || null;
}

function minScoreForAiDraft(): number {
  const raw = process.env.GROWTH_MIN_DRAFT_SCORE?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 42;
  return Number.isFinite(n) ? n : 42;
}

function systemPromptForPlatform(platform: GrowthPlatform): string {
  if (platform === "x") {
    const link = shortBookingUrlForX();
    return `You write PUBLIC tweet replies for Stackwise Technologies (founders → production-ready MVPs: engineering, cloud, UX).

This is a reply under their tweet — NOT a DM, NOT email, NOT LinkedIn.

Strict rules:
- Entire reply ≤ ${X_REPLY_MAX_LENGTH} characters including the link (count carefully).
- Tone: human, in-thread, slightly casual — like a founder chiming in. Use contractions.
- Do NOT open with "Hi [name]", "Hey", "Hope this finds you", or "I saw your post".
- 1–2 short sentences that respond to what they said; one concrete angle from their tweet or profile.
- Last line ONLY the calendar link: ${link}
- No hashtags, no bullet lists, no sales brochure, no "we help founders" cliché unless very tight.
- Never mention ICP, keyword search, "vibe coded", or how we found them.

OUTPUT: Only the reply text that will be posted on X. No planning or meta commentary.`;
  }

  return `You write outbound replies for Stackwise Technologies — we help founders and product leaders take fast-built MVPs to production (engineering, cloud, UX) without throwing away what already works.

Rules:
- Target decision makers, founders, and industry leaders only. Sound like a peer, not a sales bot.
- Reference something specific from their post and (if provided) their profile.
- 2–4 short paragraphs max; plain language; no hashtags; no "Hope this finds you well".
- One soft CTA: offer a short call and include the booking link exactly once at the end.
- Do not invent facts not supported by the context below.
- Never mention ICP, keyword search, "vibe coded", or how we found the post.

OUTPUT FORMAT: Reply with ONLY the message text for LinkedIn. No planning or analysis.`;
}

function userPromptForPlatform(
  input: PersonalizedDraftInput,
  discoveryKeyword: string | null,
): string {
  const name = firstName(input.authorName);
  const booking =
    input.platform === "x" ? shortBookingUrlForX() : bookingUrl();

  const base = `Person: ${input.authorName}
Role: ${input.roleTitle ?? "unknown"}
Company: ${input.companyName ?? "unknown"}

Profile research:
${input.profileSummary?.trim() || "Use only the post."}

Their post:
${input.bodyText.slice(0, 1500)}
${
  discoveryKeyword
    ? `\n(Internal — never mention: keyword "${discoveryKeyword}".)`
    : ""
}`;

  if (input.platform === "x") {
    return `${base}

Write a public tweet reply (max ${X_REPLY_MAX_LENGTH} chars total). Respond to ${name}'s point in-thread. End with: ${booking}`;
  }

  return `Lead fit score: ${input.compositeScore}/100
Score signals: ${input.scoreReasons.slice(0, 6).join("; ") || "n/a"}

${base}

Write the LinkedIn reply to ${name}. End with the booking link on its own line: ${booking}`;
}

export async function buildPersonalizedReplyDraft(
  input: PersonalizedDraftInput,
): Promise<{ body: string; usedAi: boolean; aiError?: string }> {
  const fallback = buildReplyDraft({
    authorName: input.authorName,
    bodyText: input.bodyText,
    platform: input.platform,
  });

  const discoveryKeyword = normalizeDiscoveryKeyword(input.contextSummary);

  if (input.compositeScore < minScoreForAiDraft()) {
    growthAiLog("Skipping OpenRouter — score below threshold", {
      author: input.authorName,
      compositeScore: input.compositeScore,
      minScore: minScoreForAiDraft(),
    });
    return { body: fallback, usedAi: false };
  }

  if (!isOpenRouterConfigured()) {
    growthAiLog("Skipping OpenRouter — no API key", { author: input.authorName });
    return { body: fallback, usedAi: false, aiError: "OPENROUTER_API_KEY not configured" };
  }

  growthAiLog("Drafting with OpenRouter", {
    author: input.authorName,
    platform: input.platform,
    model: openRouterModel(),
    compositeScore: input.compositeScore,
    profileSummaryChars: input.profileSummary?.trim().length ?? 0,
    postChars: input.bodyText.length,
    discoveryKeyword: discoveryKeyword ?? null,
  });

  const system = systemPromptForPlatform(input.platform);
  const user = userPromptForPlatform(input, discoveryKeyword);

  growthAiLogMultiline("Prompt → user message", user);

  const result = await openRouterChat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    {
      maxTokens: input.platform === "x" ? 120 : 520,
      temperature: input.platform === "x" ? 0.75 : 0.7,
    },
  );

  if ("error" in result) {
    growthAiLog("Using template fallback after API error", {
      author: input.authorName,
      error: result.error,
    });
    return { body: fallback, usedAi: false, aiError: result.error };
  }

  let body = finalizeReplyForPlatform(input.platform, result.text);

  if (input.platform === "x") {
    const link = shortBookingUrlForX();
    if (!body.includes("cal.com")) {
      body = finalizeReplyForPlatform("x", `${body}\n${link}`);
    }
  } else {
    const booking = bookingUrl();
    if (!body.includes(booking)) {
      body = `${body.trim()}\n\n${booking}`;
    }
  }

  growthAiLog("Draft ready", {
    author: input.authorName,
    usedAi: true,
    bodyChars: body.length,
    withinXLimit: input.platform === "x" ? body.length <= X_REPLY_MAX_LENGTH : true,
  });

  return { body, usedAi: true };
}
