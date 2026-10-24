import type { IcpConfig, IngestSignalInput } from "@/lib/growth/types";
import { isPostedWithinHours } from "@/lib/growth/harvest-freshness";
import {
  HARVEST_MAX_POST_AGE_HOURS,
  HARVEST_MIN_COMPOSITE_SCORE,
} from "@/lib/growth/harvest-config";
import { scoreLead, type ScoreResult } from "@/lib/growth/scoring";
import type { HarvestFilterResult } from "@/lib/growth/harvest-quality";

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

const JOB_HINTS = [
  "hiring",
  "job",
  "opening",
  "role",
  "position",
  "engineer",
  "developer",
  "contract",
  "freelance",
  "remote",
  "full-time",
  "full time",
];

export function looksLikeJobPosting(signal: IngestSignalInput): boolean {
  const body = normalize(signal.bodyText);
  if (signal.roleTitle?.trim()) return true;
  if (signal.companyName?.trim() && body.length >= 20) return true;
  return JOB_HINTS.some((hint) => body.includes(hint));
}

/** Quality gate for freehire / job-board ingest (less strict than social harvest). */
export function evaluateJobIngestCandidate(
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

  const body = normalize(signal.bodyText);
  if (body.length < 15) {
    return { ok: false, reason: "Job description too short" };
  }

  if (!looksLikeJobPosting(signal)) {
    return { ok: false, reason: "Does not look like a job posting" };
  }

  if (
    signal.postedAt &&
    !isPostedWithinHours(signal.postedAt, maxPostAgeHours)
  ) {
    return { ok: false, reason: `Job older than ${maxPostAgeHours}h` };
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
    if (body.includes(normalize(bad))) {
      return { ok: false, reason: `Excluded: ${bad}` };
    }
  }

  return { ok: true, score };
}
