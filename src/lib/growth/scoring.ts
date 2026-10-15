import type { IcpConfig } from "@/lib/growth/types";

export type ScoreInput = {
  roleTitle?: string | null;
  companyName?: string | null;
  bodyText: string;
  config: IcpConfig;
};

export type ScoreResult = {
  icpScore: number;
  intentScore: number;
  compositeScore: number;
  reasons: string[];
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function scoreLead(input: ScoreInput): ScoreResult {
  const haystack = normalize(
    [input.roleTitle, input.companyName, input.bodyText].filter(Boolean).join(" "),
  );
  const reasons: string[] = [];
  let icp = 40;

  for (const bad of input.config.titleExclusions) {
    if (haystack.includes(normalize(bad))) {
      icp -= 45;
      reasons.push(`Excluded role signal: "${bad}"`);
    }
  }

  let titleHits = 0;
  for (const keyword of input.config.titleKeywords) {
    if (haystack.includes(normalize(keyword))) {
      titleHits += 1;
      icp += 12;
      reasons.push(`ICP title match: "${keyword}"`);
    }
  }
  if (titleHits === 0 && input.roleTitle) {
    reasons.push("No ICP title keyword matched");
  }

  let intent = 15;
  let intentHits = 0;
  for (const phrase of input.config.intentPhrases) {
    if (haystack.includes(normalize(phrase))) {
      intentHits += 1;
      intent += 14;
      reasons.push(`Intent: "${phrase}"`);
    }
  }
  if (intentHits === 0) {
    reasons.push("No strong intent phrase detected");
  }

  icp = Math.max(0, Math.min(100, icp));
  intent = Math.max(0, Math.min(100, intent));
  const composite = Math.round(intent * 0.55 + icp * 0.45);

  return {
    icpScore: icp,
    intentScore: intent,
    compositeScore: composite,
    reasons,
  };
}
