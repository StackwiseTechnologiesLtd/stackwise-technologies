/** Max age of a post (from platform timestamp) to ingest during harvest. */
export const HARVEST_MAX_POST_AGE_HOURS = 72;

/** Skip low-fit posts at harvest time (composite 0–100). */
export const HARVEST_MIN_COMPOSITE_SCORE = 45;

/** Extra title signals for job-board scoring (internships and IC roles are in scope). */
export const JOB_INGEST_TITLE_KEYWORDS = [
  "engineer",
  "developer",
  "software",
  "intern",
  "full stack",
  "full-stack",
  "backend",
  "frontend",
  "ai",
  "machine learning",
];

/** Job ingest ignores intern/student exclusions; social harvest keeps them. */
export const JOB_INGEST_SKIPPED_TITLE_EXCLUSIONS = new Set(["intern", "student"]);

/** Job-board ingest (freehire / JEV): titles match ICP keywords; intent phrases are rare in JDs. */
export const JOB_INGEST_MIN_COMPOSITE_SCORE = (() => {
  const raw = process.env.GROWTH_JOB_INGEST_MIN_SCORE?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 30;
  return Number.isFinite(n) ? n : 30;
})();

/** Max age for job-board ingest (JEV discover uses ~14d; social harvest uses 72h). */
export const JOB_INGEST_MAX_POST_AGE_HOURS = (() => {
  const raw = process.env.GROWTH_JOB_MAX_AGE_HOURS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : HARVEST_MAX_POST_AGE_HOURS;
  return Number.isFinite(n) ? n : HARVEST_MAX_POST_AGE_HOURS;
})();

/** Default inbox window: leads from posts seen in this period. */
export const INBOX_DEFAULT_FRESHNESS_HOURS = 72;
