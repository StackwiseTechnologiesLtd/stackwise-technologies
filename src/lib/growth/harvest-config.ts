/** Max age of a post (from platform timestamp) to ingest during harvest. */
export const HARVEST_MAX_POST_AGE_HOURS = 72;

/** Skip low-fit posts at harvest time (composite 0–100). */
export const HARVEST_MIN_COMPOSITE_SCORE = 45;

/** Default inbox window: leads from posts seen in this period. */
export const INBOX_DEFAULT_FRESHNESS_HOURS = 72;
