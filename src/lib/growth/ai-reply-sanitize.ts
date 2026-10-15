/** Detect model chain-of-thought / planning leaked into the draft body. */
export function looksLikeMetaReasoning(text: string): boolean {
  const sample = text.slice(0, 2500).toLowerCase();
  const markers = [
    "the user wants me to",
    "let me review",
    "let me craft",
    "i need to reference",
    "key details from their post",
    "constraints:",
    "re-reading:",
    "actually, re-reading",
    "output only the final",
    "rules:",
    "never mention icp",
  ];
  if (markers.some((m) => sample.includes(m))) return true;
  if (/^\s*\d+\.\s+target decision makers/m.test(text.trim())) return true;
  if (sample.includes("booking link exactly once") && sample.includes("paragraphs max")) {
    return true;
  }
  return false;
}

export function stripThinkingBlocks(text: string): string {
  let out = text.replace(/[\s\S]*?<\/think>/gi, "").trim();
  out = out.replace(/^```(?:text|markdown)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return out;
}

export function sanitizeOutboundReply(raw: string): {
  text: string;
  rejectedAsMeta: boolean;
} {
  const text = stripThinkingBlocks(raw).trim();
  if (!text) return { text: "", rejectedAsMeta: false };
  if (looksLikeMetaReasoning(text)) {
    return { text: "", rejectedAsMeta: true };
  }
  return { text, rejectedAsMeta: false };
}
