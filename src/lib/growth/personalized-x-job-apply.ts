import { growthAiLog, growthAiLogMultiline } from "@/lib/growth/ai-debug";
import {
  isOpenRouterConfigured,
  openRouterChat,
  openRouterModel,
} from "@/lib/growth/openrouter";
import { X_REPLY_MAX_LENGTH } from "@/lib/growth/x-reply-format";

export type PersonalizedXJobApplyInput = {
  authorName: string;
  roleTitle: string | null;
  companyName: string | null;
  bodyText: string;
  profileSummary?: string | null;
};

function templateXJobReply(input: PersonalizedXJobApplyInput): string {
  const role = input.roleTitle?.trim() || "this role";
  return `Interested in ${role} — full-stack dev (Next.js, Node, Postgres), shipped production MVPs. DMs open or tshikombadaniel@gmail.com`;
}

function fitToXLimit(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= X_REPLY_MAX_LENGTH) return compact;
  return `${compact.slice(0, X_REPLY_MAX_LENGTH - 1).trimEnd()}…`;
}

/** Public X reply when applying to a hiring post (developer, not agency pitch). */
export async function buildPersonalizedXJobApplyReply(
  input: PersonalizedXJobApplyInput,
): Promise<{ body: string; usedAi: boolean; aiError?: string }> {
  const fallback = fitToXLimit(templateXJobReply(input));

  if (!isOpenRouterConfigured()) {
    return { body: fallback, usedAi: false };
  }

  const system = `You write public X (Twitter) replies in FIRST PERSON as Daniel, a full-stack developer applying to a hiring post.

Rules:
- Max ${X_REPLY_MAX_LENGTH} characters total. One short paragraph, no line breaks.
- Start with interest in the specific role/stack from the post; one proof point (Next.js/Node/Postgres, production MVPs).
- Never write as the employer or recruiter. Never say "I saw your application".
- Tone: direct peer, not agency sales pitch. No Cal.com links.
- End with DMs open or tshikombadaniel@gmail.com — do not invent other URLs.
- Skip only if the post is clearly not a job ad (rant, meme, political thread, no role) — output exactly: SKIP. Job reposts/aggregators with a role title are OK.
- No hashtags, no "Hope this finds you well".
OUTPUT: Only the reply text, or SKIP.`;

  const user = `Hiring post author: ${input.authorName}
Role: ${input.roleTitle ?? "unknown"}
Company: ${input.companyName ?? "unknown"}
Post:
${input.bodyText.slice(0, 2000)}
${input.profileSummary ? `Applicant context:\n${input.profileSummary.slice(0, 600)}` : ""}`;

  growthAiLog("x-job-apply", { model: openRouterModel() });
  growthAiLogMultiline("x-job-apply-prompt", user);

  const result = await openRouterChat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { maxTokens: 120, temperature: 0.65 },
  );

  if ("error" in result) {
    growthAiLog("x-job-apply-error", { error: result.error });
    return { body: fallback, usedAi: false, aiError: result.error };
  }

  const raw = result.text.trim();
  if (/^skip\b/i.test(raw)) {
    return { body: "", usedAi: true, aiError: "not_a_job_post" };
  }

  const body = fitToXLimit(raw || fallback);
  growthAiLogMultiline("x-job-apply-out", body);
  return { body, usedAi: Boolean(raw) };
}