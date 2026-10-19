import { COMPANY_RC, COMPANY_WEBSITE_URL } from "@/lib/company";
import { EMAIL, SITE_NAME } from "@/lib/content";
import { isOpenRouterConfigured, openRouterChat } from "@/lib/growth/openrouter";
import { SERVICES_CATALOG } from "@/lib/services-catalog";
import {
  contractDocumentKindLabel,
  type ContractDocumentKind,
} from "@/lib/contracts/types";

export type ContractAiDraftInput = {
  documentKind: ContractDocumentKind;
  customerName: string;
  customerEmail: string;
  companyName?: string | null;
  servicesBrief: string;
  commercialNotes?: string | null;
};

export type ContractAiDraftResult = {
  title: string;
  bodyMarkdown: string;
  usedAi: boolean;
  aiError?: string;
};

function catalogSummary(): string {
  return SERVICES_CATALOG
    .map((s) => `- ${s.name}: ${s.description}`)
    .join("\n");
}

function systemPrompt(): string {
  return `You draft professional legal-style business documents for ${SITE_NAME} (RC: ${COMPANY_RC}, ${EMAIL}, ${COMPANY_WEBSITE_URL}).

Stackwise provides software engineering, cloud infrastructure, AI integration, and technical advisory for founders and product teams.

Rules:
- Write clear, professional English suitable for B2B services contracts.
- Use markdown: ## and ### section headings, numbered lists for obligations, bullet lists for deliverables.
- Include standard commercial sections appropriate to the document type (parties, scope, fees placeholder, term, confidentiality where relevant, limitation of liability, governing law — default Kenya unless brief says otherwise).
- Do NOT invent specific dollar amounts unless the brief includes them; use placeholders like "[Agreed fee]" or "as set out in Schedule A".
- Party names: use the client name from the brief as the customer; Stackwise Technologies Limited as service provider.
- No meta commentary, no "as an AI", no code fences in the document body.

OUTPUT FORMAT: Reply with ONLY valid JSON (no markdown wrapper):
{"title":"Document title","bodyMarkdown":"full document in markdown"}`;
}

function userPrompt(input: ContractAiDraftInput): string {
  const kindLabel = contractDocumentKindLabel(input.documentKind);
  const clientOrg = input.companyName?.trim() || input.customerName.trim();

  return `Document type: ${kindLabel} (${input.documentKind})

Customer contact: ${input.customerName.trim()} <${input.customerEmail.trim()}>
Customer organization (party name): ${clientOrg}

Services and requirements from our team:
${input.servicesBrief.trim()}

${input.commercialNotes?.trim() ? `Commercial / timeline notes:\n${input.commercialNotes.trim()}\n` : ""}
Service catalog (for scope language only — do not list all items unless relevant):
${catalogSummary()}

Draft the complete ${kindLabel} now.`;
}

function parseAiJson(raw: string): { title: string; bodyMarkdown: string } | null {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const parsed = JSON.parse(text) as {
      title?: string;
      bodyMarkdown?: string;
    };
    if (!parsed.title?.trim() || !parsed.bodyMarkdown?.trim()) return null;
    return {
      title: parsed.title.trim(),
      bodyMarkdown: parsed.bodyMarkdown.trim(),
    };
  } catch {
    return null;
  }
}

function fallbackDraft(input: ContractAiDraftInput): ContractAiDraftResult {
  const kindLabel = contractDocumentKindLabel(input.documentKind);
  const client = input.companyName?.trim() || input.customerName.trim();
  return {
    title: `${kindLabel} — ${client}`,
    bodyMarkdown: `## ${kindLabel}

This agreement is between **Stackwise Technologies Limited** ("Stackwise") and **${client}** ("Client").

## Scope

${input.servicesBrief.trim()}

## Fees

[Agreed fee and payment schedule to be confirmed in writing.]

## Term

[Start date] through [end date or completion of deliverables.]

## General

Each party will act in good faith. Governing law: Kenya. Notices to ${EMAIL}.

---
*Draft generated without AI — configure OPENROUTER_API_KEY for full drafts.*`,
    usedAi: false,
    aiError: "OPENROUTER_API_KEY not configured",
  };
}

export async function generateContractDraft(
  input: ContractAiDraftInput,
): Promise<ContractAiDraftResult> {
  if (!isOpenRouterConfigured()) {
    return fallbackDraft(input);
  }

  const result = await openRouterChat(
    [
      { role: "system", content: systemPrompt() },
      { role: "user", content: userPrompt(input) },
    ],
    { maxTokens: 8000, temperature: 0.4 },
  );

  if ("error" in result) {
    const fb = fallbackDraft(input);
    return {
      ...fb,
      aiError: result.error,
    };
  }

  if (!result.text) {
    const fb = fallbackDraft(input);
    return {
      ...fb,
      aiError: "Empty AI response",
    };
  }

  const parsed = parseAiJson(result.text);
  if (!parsed) {
    const fb = fallbackDraft(input);
    return {
      ...fb,
      aiError: "Could not parse AI JSON response",
    };
  }

  return {
    title: parsed.title,
    bodyMarkdown: parsed.bodyMarkdown,
    usedAi: true,
  };
}
