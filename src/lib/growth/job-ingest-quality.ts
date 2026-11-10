import type { IcpConfig, IngestSignalInput } from "@/lib/growth/types";
import { isPostedWithinHours } from "@/lib/growth/harvest-freshness";
import {
  JOB_INGEST_MAX_POST_AGE_HOURS,
  JOB_INGEST_MIN_COMPOSITE_SCORE,
  JOB_INGEST_SKIPPED_TITLE_EXCLUSIONS,
  JOB_INGEST_TITLE_KEYWORDS,
} from "@/lib/growth/harvest-config";
import { scoreLead } from "@/lib/growth/scoring";
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

/** ICP for job boards: internships allowed; engineering titles score fairly. */
export function icpConfigForJobIngest(config: IcpConfig): IcpConfig {
  const titleExclusions = config.titleExclusions.filter(
    (bad) => !JOB_INGEST_SKIPPED_TITLE_EXCLUSIONS.has(bad.toLowerCase()),
  );
  const titleKeywords = [
    ...new Set([...config.titleKeywords, ...JOB_INGEST_TITLE_KEYWORDS]),
  ];
  return { ...config, titleExclusions, titleKeywords };
}

export function looksLikeJobPosting(signal: IngestSignalInput): boolean {
  const body = normalize(signal.bodyText);
  if (signal.roleTitle?.trim()) return true;
  if (signal.companyName?.trim() && body.length >= 20) return true;
  return JOB_HINTS.some((hint) => body.includes(hint));
}

/** Quality gate for freehire / LinkedIn Jobs / job-board ingest (less strict than social harvest). */
export function evaluateJobIngestCandidate(
  signal: IngestSignalInput,
  config: IcpConfig,
  options?: {
    minCompositeScore?: number;
    maxPostAgeHours?: number;
  },
): HarvestFilterResult {
  const minCompositeScore =
    options?.minCompositeScore ?? JOB_INGEST_MIN_COMPOSITE_SCORE;
  const maxPostAgeHours = options?.maxPostAgeHours ?? JOB_INGEST_MAX_POST_AGE_HOURS;

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

  const jobConfig = icpConfigForJobIngest(config);

  const score = scoreLead({
    roleTitle: signal.roleTitle,
    companyName: signal.companyName,
    bodyText: signal.bodyText,
    config: jobConfig,
  });

  if (score.compositeScore < minCompositeScore) {
    return {
      ok: false,
      reason: `Fit score ${score.compositeScore} below ${minCompositeScore}`,
    };
  }

  for (const bad of jobConfig.titleExclusions) {
    if (body.includes(normalize(bad))) {
      return { ok: false, reason: `Excluded: ${bad}` };
    }
  }

  return { ok: true, score };
}
