import { bookingUrl } from "@/lib/booking";
import { buildReplyDraft, firstName } from "@/lib/growth/drafts";
import { isOpenRouterConfigured, openRouterChat } from "@/lib/growth/openrouter";
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
    contextSummary: input.contextSummary,
  });

  if (input.compositeScore < minScoreForAiDraft()) {
    return { body: fallback, usedAi: false };
  }

  if (!isOpenRouterConfigured()) {
    return { body: fallback, usedAi: false, aiError: "OPENROUTER_API_KEY not configured" };
  }

  const name = firstName(input.authorName);
  const booking = bookingUrl();

  const system = `You write outbound replies for Stackwise Technologies — we help founders and product leaders take fast-built MVPs to production (engineering, cloud, UX) without throwing away what already works.

Rules:
- Target decision makers, founders, and industry leaders only. Sound like a peer, not a sales bot.
- Reference something specific from their post and (if provided) their profile — never a generic "saw your post about…" opener without real detail.
- 2–4 short paragraphs max; plain language; no hashtags; no "Hope this finds you well".
- One soft CTA: offer a short call and include the booking link exactly once at the end.
- Do not invent facts about the person or company not supported by the context below.
- Platform tone: ${input.platform === "linkedin" ? "LinkedIn — professional, concise" : "X — direct, slightly casual"}`.trim();

  const user = `Lead fit score: ${input.compositeScore}/100
Score signals: ${input.scoreReasons.slice(0, 6).join("; ") || "n/a"}

Person: ${input.authorName}
Role: ${input.roleTitle ?? "unknown"}
Company: ${input.companyName ?? "unknown"}

Profile research (from their public profile page):
${input.profileSummary?.trim() || "No profile page captured — use only the post."}

Their post / signal:
${input.bodyText.slice(0, 2000)}

Search / context: ${input.contextSummary ?? "n/a"}

Write a reply addressed to ${name}. End with the booking link on its own line: ${booking}`;

  const result = await openRouterChat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { maxTokens: 520, temperature: 0.7 },
  );

  if ("error" in result) {
    return { body: fallback, usedAi: false, aiError: result.error };
  }

  let body = result.text;
  if (!body.includes(booking)) {
    body = `${body.trim()}\n\n${booking}`;
  }

  return { body, usedAi: true };
}
