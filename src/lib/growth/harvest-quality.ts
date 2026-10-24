import type { IcpConfig, IngestSignalInput } from "@/lib/growth/types";
import { isPostedWithinHours } from "@/lib/growth/harvest-freshness";
import {
  HARVEST_MAX_POST_AGE_HOURS,
  HARVEST_MIN_COMPOSITE_SCORE,
} from "@/lib/growth/harvest-config";
import { scoreLead, type ScoreResult } from "@/lib/growth/scoring";

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Post body must relate to the search query or ICP intent/title keywords. */
export function signalMatchesDiscovery(
  bodyText: string,
  discoveryQuery: string | null | undefined,
  config: IcpConfig,
): boolean {
  const body = normalize(bodyText);
  if (body.length < 20) return false;

  const query = discoveryQuery?.trim();
  if (query) {
    const terms = normalize(query)
      .split(/\s+/)
      .filter((w) => w.length >= 4);
    if (terms.length > 0 && terms.some((t) => body.includes(t))) {
      return true;
    }
    if (body.includes(normalize(query))) return true;
  }

  for (const phrase of config.intentPhrases) {
    const p = normalize(phrase);
    if (p.length >= 4 && body.includes(p)) return true;
  }

  for (const keyword of config.titleKeywords) {
    const k = normalize(keyword);
    if (k.length >= 3 && body.includes(k)) return true;
  }

  return false;
}

export function isLowQualityPostBody(bodyText: string): boolean {
  const body = normalize(bodyText);
  if (body.length < 25) return true;
  const noise = [
    "like comment repost send",
    "follow to see more",
    "promoted",
    "suggested for you",
  ];
  return noise.some((n) => body.includes(n) && body.length < 120);
}

export type HarvestFilterResult =
  | { ok: true; score: ScoreResult }
  | { ok: false; reason: string };

export function evaluateHarvestCandidate(
  signal: IngestSignalInput,
  config: IcpConfig,
  options?: {
    minCompositeScore?: number;
    maxPostAgeHours?: number;
  },
): HarvestFilterResult {
  const minCompositeScore =
    options?.minCompositeScore ?? HARVEST_MIN_COMPOSITE_SCORE;
  const maxPostAgeHours = options?.maxPostAgeHours ?? HARVEST_MAX_POST_AGE_HOURS;

  if (isLowQualityPostBody(signal.bodyText)) {
    return { ok: false, reason: "Post text too short or looks like UI noise" };
  }

  if (
    !signalMatchesDiscovery(
      signal.bodyText,
      signal.contextSummary,
      config,
    )
  ) {
    return { ok: false, reason: "Post does not match ICP search or intent" };
  }

  if (
    signal.postedAt &&
    !isPostedWithinHours(signal.postedAt, maxPostAgeHours)
  ) {
    return { ok: false, reason: `Post older than ${maxPostAgeHours}h` };
  }

  const score = scoreLead({
    roleTitle: signal.roleTitle,
    companyName: signal.companyName,
    bodyText: signal.bodyText,
    config,
  });

  if (score.compositeScore < minCompositeScore) {
    return {
      ok: false,
      reason: `Fit score ${score.compositeScore} below ${minCompositeScore}`,
    };
  }

  for (const bad of config.titleExclusions) {
    if (normalize(signal.bodyText).includes(normalize(bad))) {
      return { ok: false, reason: `Excluded: ${bad}` };
    }
  }

  return { ok: true, score };
}
