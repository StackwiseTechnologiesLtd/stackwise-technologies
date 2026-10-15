import { bookingUrl } from "@/lib/booking";
import { buildReplyDraft, firstName } from "@/lib/growth/drafts";
import { growthAiLog, growthAiLogMultiline } from "@/lib/growth/ai-debug";
import { isOpenRouterConfigured, openRouterChat, openRouterModel } from "@/lib/growth/openrouter";
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

export async function buildPersonalizedReplyDraft(
  input: PersonalizedDraftInput,
): Promise<{ body: string; usedAi: boolean; aiError?: string }> {
  const fallback = buildReplyDraft({
    authorName: input.authorName,
    bodyText: input.bodyText,
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

  const name = firstName(input.authorName);
  const booking = bookingUrl();

  const system = `You write outbound replies for Stackwise Technologies — we help founders and product leaders take fast-built MVPs to production (engineering, cloud, UX) without throwing away what already works.

Rules:
- Target decision makers, founders, and industry leaders only. Sound like a peer, not a sales bot.
- Reference something specific from their post and (if provided) their profile — never a generic "saw your post about…" opener without real detail.
- 2–4 short paragraphs max; plain language; no hashtags; no "Hope this finds you well".
- One soft CTA: offer a short call and include the booking link exactly once at the end.
- Do not invent facts about the person or company not supported by the context below.
- Never mention ICP, keyword search, "vibe coded", or how we found the post — only what they actually wrote.
- Platform tone: ${input.platform === "linkedin" ? "LinkedIn — professional, concise" : "X — direct, slightly casual"}

OUTPUT FORMAT (critical):
- Reply with ONLY the message text the prospect will read on ${input.platform === "linkedin" ? "LinkedIn" : "X"}.
- No planning, no "Let me…", no restating these rules, no numbered constraint lists, no analysis.`.trim();

  const user = `Lead fit score: ${input.compositeScore}/100
Score signals: ${input.scoreReasons.slice(0, 6).join("; ") || "n/a"}

Person: ${input.authorName}
Role: ${input.roleTitle ?? "unknown"}
Company: ${input.companyName ?? "unknown"}

Profile research (from their public profile page):
${input.profileSummary?.trim() || "No profile page captured — use only the post."}

Their post (quote or paraphrase from this only):
${input.bodyText.slice(0, 2000)}
${
  discoveryKeyword
    ? `\n(Internal — do not mention in the reply: we surfaced this via keyword "${discoveryKeyword}".)`
    : ""
}

Write the outbound reply to ${name} now (message text only). End with the booking link on its own line: ${booking}`;

  growthAiLogMultiline("Prompt → user message", user);

  const result = await openRouterChat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { maxTokens: 520, temperature: 0.7 },
  );

  if ("error" in result) {
    growthAiLog("Using template fallback after API error", {
      author: input.authorName,
      error: result.error,
    });
    return { body: fallback, usedAi: false, aiError: result.error };
  }

  let body = result.text;
  if (!body.includes(booking)) {
    body = `${body.trim()}\n\n${booking}`;
  }

  growthAiLog("Draft ready", {
    author: input.authorName,
    usedAi: true,
    bodyChars: body.length,
  });

  return { body, usedAi: true };
}
