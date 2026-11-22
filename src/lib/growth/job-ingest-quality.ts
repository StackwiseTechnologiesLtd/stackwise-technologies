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
import { isXJobAggregator } from "@/lib/growth/x-job-aggregator";

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

const DEV_HIRING_RE =
  /\b(hiring|we(?:'|’)re hiring|we are hiring|join our team|open role|open position|looking for (?:a )?(?:senior )?|need(?:ing)? (?:a )?|seeking (?:a )?|contract(?:or)?(?:\s+for)?)\b/i;
const DEV_ROLE_RE =
  /\b(developer|engineer|software|full[\s-]?stack|backend|front[\s-]?end|devops|sre|react|node\.?js|typescript|javascript|python|golang|remote (?:dev|engineer)|\bswe\b)\b/i;
const SOCIAL_JOB_EXCLUDE_RE =
  /\b(open to work|#opentowork|looking for (?:a )?job|seeking employment|hire me|commissions? open)\b/i;

/** X/LinkedIn posts advertising dev roles (Daniel apply-to list). */
export function isDeveloperHiringPost(bodyText: string): boolean {
  const text = bodyText.trim();
  if (text.length < 30 || SOCIAL_JOB_EXCLUDE_RE.test(text)) return false;
  return DEV_HIRING_RE.test(text) && DEV_ROLE_RE.test(text);
}

/** Hiring post from a real employer account (not a job-board reposter). */
export function isDeveloperHiringSignal(
  authorName: string,
  bodyText: string,
): boolean {
  if (isXJobAggregator(authorName, bodyText)) return false;
  return isDeveloperHiringPost(bodyText);
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
