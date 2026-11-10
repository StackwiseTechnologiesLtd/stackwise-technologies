import { growthAiLog, growthAiLogMultiline } from "@/lib/growth/ai-debug";
import {
  isOpenRouterConfigured,
  openRouterChat,
  openRouterModel,
} from "@/lib/growth/openrouter";

export type PersonalizedApplyDraftInput = {
  roleTitle: string | null;
  companyName: string | null;
  bodyText: string;
  profileSummary?: string | null;
};

function templateApplyNote(input: PersonalizedApplyDraftInput): string {
  const role = input.roleTitle?.trim() || "this role";
  const company = input.companyName?.trim() || "your team";
  return `Hi — I'm interested in ${role} at ${company}. I've shipped production full-stack products (Next.js, Node, Postgres) for founders moving from MVP to reliable delivery. Happy to share a short portfolio note or jump on a quick call if useful.`;
}

export async function buildPersonalizedApplyNote(
  input: PersonalizedApplyDraftInput,
): Promise<{ body: string; usedAi: boolean; aiError?: string }> {
  const fallback = templateApplyNote(input);

  if (!isOpenRouterConfigured()) {
    return { body: fallback, usedAi: false };
  }

  const system = `You write short job-application notes for Stackwise Technologies (agency: founders → production-ready MVPs).

Rules:
- 2–4 short sentences, peer tone, no "Hope this finds you well".
- Reference the role and company; one concrete proof point about shipping product.
- No salary asks, no attachments language, no hashtags.
- Do not invent employer facts beyond the job text.
OUTPUT: Only the note text the human will paste into Easy Apply / ATS.`;

  const user = `Role: ${input.roleTitle ?? "unknown"}
Company: ${input.companyName ?? "unknown"}
Job text:
${input.bodyText.slice(0, 2500)}
${input.profileSummary ? `Applicant context:\n${input.profileSummary.slice(0, 800)}` : ""}`;

  growthAiLog("apply-note", `model=${openRouterModel()}`);
  growthAiLogMultiline("apply-note-prompt", user);

  try {
    const { text } = await openRouterChat({
      system,
      user,
      maxTokens: 400,
    });
    const body = text.trim() || fallback;
    growthAiLogMultiline("apply-note-out", body);
    return { body, usedAi: Boolean(text.trim()) };
  } catch (error) {
    const aiError = error instanceof Error ? error.message : "OpenRouter failed";
    growthAiLog("apply-note-error", aiError);
    return { body: fallback, usedAi: false, aiError };
  }
}
