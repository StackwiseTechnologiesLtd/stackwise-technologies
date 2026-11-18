import { growthAiLog, growthAiLogMultiline } from "@/lib/growth/ai-debug";
import {
  isOpenRouterConfigured,
  openRouterChat,
  openRouterModel,
} from "@/lib/growth/openrouter";
import { isJobAggregatorContext } from "@/lib/growth/x-apply-urls";
import { X_REPLY_MAX_LENGTH } from "@/lib/growth/x-reply-format";

export type PersonalizedXJobApplyInput = {
  authorName: string;
  roleTitle: string | null;
  companyName: string | null;
  bodyText: string;
  profileSummary?: string | null;
  /** When set, public X reply should not pitch DMs; apply happens on this URL. */
  applyUrl?: string | null;
};

function templateXJobReply(input: PersonalizedXJobApplyInput): string {
  const role = input.roleTitle?.trim() || "this role";
  const agg = isJobAggregatorContext(input.authorName, input.bodyText);
  if (agg) {
    return `Interested in ${role}. I ship full-stack MVPs with Next.js, Node, and Postgres.`;
  }
  return `Interested in ${role}. I ship full-stack MVPs with Next.js, Node, and Postgres. Happy to share a portfolio link by email: tshikombadaniel@gmail.com`;
}

function fitToXLimit(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= X_REPLY_MAX_LENGTH) return compact;
  return `${compact.slice(0, X_REPLY_MAX_LENGTH - 1).trimEnd()}…`;
}

function stripEmDash(text: string): string {
  return text.replace(/\s*[—–]\s*/g, ", ").replace(/--/g, ", ");
}

/** Public X reply when applying to a hiring post (developer, not agency pitch). */
export async function buildPersonalizedXJobApplyReply(
  input: PersonalizedXJobApplyInput,
): Promise<{ body: string; usedAi: boolean; aiError?: string }> {
  if (input.applyUrl?.trim()) {
    return { body: "", usedAi: false, aiError: "use_ats_instead" };
  }

  const aggregator = isJobAggregatorContext(input.authorName, input.bodyText);
  const fallback = fitToXLimit(stripEmDash(templateXJobReply(input)));

  if (!isOpenRouterConfigured()) {
    return { body: fallback, usedAi: false };
  }

  const system = `You write public X replies in first person as Daniel, a full-stack developer responding to a hiring post.

Style (antislop):
- Max ${X_REPLY_MAX_LENGTH} characters. One short paragraph, no line breaks.
- Plain words only. No em dash, no hashtags, no buzzwords (seamless, robust, exciting journey, etc.).
- One concrete stack line (Next.js, Node, Postgres, production MVPs) tied to what the post mentions.
- Never write as the recruiter. Never say "I saw your application".
- No chatbot closers ("hope this helps", "let me know if you have questions").

Apply link rules:
- If the post or context says to apply via a link in the post or in a reply, output exactly: SKIP
- Job repost/aggregator accounts (job boards, "remote jobs" channels): do not ask people to DM you. Mention interest and stack only, or SKIP if they only want applications through a link.
- Direct employer posts without an apply URL: you may end with email tshikombadaniel@gmail.com once. No "DMs open" spam.
- SKIP only for non-jobs (meme, politics, no role).

OUTPUT: Only the reply text, or SKIP.`;

  const user = `Hiring post author: ${input.authorName}
Aggregator/repost account: ${aggregator ? "yes" : "no"}
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
    { maxTokens: 120, temperature: 0.55 },
  );

  if ("error" in result) {
    growthAiLog("x-job-apply-error", { error: result.error });
    return { body: fallback, usedAi: false, aiError: result.error };
  }

  const raw = stripEmDash(result.text.trim());
  if (/^skip\b/i.test(raw)) {
    return { body: "", usedAi: true, aiError: "not_a_job_post" };
  }

  const body = fitToXLimit(raw || fallback);
  growthAiLogMultiline("x-job-apply-out", body);
  return { body, usedAi: Boolean(raw) };
}

export function applyUrlAckLabel(applyUrl: string): string {
  try {
    const host = new URL(applyUrl).hostname.toLowerCase();
    if (host.includes("ashbyhq")) return "Ashby posting";
    if (host.includes("greenhouse.io") || host.includes("boards.greenhouse")) {
      return "Greenhouse posting";
    }
    if (host.includes("lever.co")) return "Lever posting";
    if (host.includes("jobvite")) return "Jobvite posting";
    if (host.includes("smartrecruiters")) return "SmartRecruiters posting";
    if (host.includes("workday") || host.includes("myworkdayjobs")) {
      return "Workday posting";
    }
    if (host.includes("careers.")) return "careers page";
  } catch {
    /* ignore */
  }
  return "application link";
}

/** Short public reply after opening an ATS link (antislop template, no DMs). */
export function buildXJobAtsAckReply(input: {
  roleTitle: string | null;
  applyUrl: string;
}): string {
  const role = input.roleTitle?.trim() || "this role";
  const where = applyUrlAckLabel(input.applyUrl);
  return fitToXLimit(
    stripEmDash(
      `On your ${where} for ${role}. Full-stack: Next.js, Node, Postgres.`,
    ),
  );
}

export function isXAckAfterAtsEnabled(): boolean {
  return process.env.GROWTH_X_ACK_AFTER_ATS !== "0";
}