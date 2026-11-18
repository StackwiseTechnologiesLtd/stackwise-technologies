/** Parse apply / job-board URLs from X post text and thread hints. */

const SOCIAL_HOST_RE =
  /(?:^|\/\/)(?:x\.com|twitter\.com|t\.co|t\.me|telegram|instagram\.com)\b/i;

const JOB_BOARD_RE =
  /ashbyhq\.com|jobvite\.com|smartrecruiters|greenhouse\.io|lever\.co|workday|myworkdayjobs|jobs\.lever|boards\.greenhouse|apply\.workable|breezy\.hr|jobs\.|careers\.|\/jobs\/|\/job\/|bit\.ly\/|tinyurl\.com/i;

const THREAD_LINK_HINT_RE =
  /\b(apply\s+link\s+in\s+(the\s+)?reply|link\s+in\s+(the\s+)?(main\s+)?post|apply\s+(now\s+)?👇|see\s+(the\s+)?reply|in\s+the\s+thread|check\s+(the\s+)?reply|apply\s+via\s+the\s+link)\b/i;

export function normalizeBrokenPostUrls(text: string): string {
  return text
    .replace(/https?:\/\/\s*\n+\s*/gi, "https://")
    .replace(/(\S)\n+(?=[a-z0-9./-])/gi, "$1");
}

export function extractUrlsFromPostText(bodyText: string): string[] {
  const text = normalizeBrokenPostUrls(bodyText);
  const urls: string[] = [];
  const re = /https?:\/\/[^\s<>"')}\]]+/gi;
  for (const match of text.matchAll(re)) {
    let u = match[0].replace(/[.,;:!?)]+$/, "");
    if (SOCIAL_HOST_RE.test(u)) continue;
    urls.push(u);
  }
  return [...new Set(urls)];
}

export function isLikelyJobApplyUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (SOCIAL_HOST_RE.test(host)) return false;
    return JOB_BOARD_RE.test(url) || JOB_BOARD_RE.test(host);
  } catch {
    return JOB_BOARD_RE.test(url);
  }
}

export function pickBestApplyUrl(urls: string[]): string | null {
  const job = urls.filter(isLikelyJobApplyUrl);
  if (job.length > 0) return job[0];
  const ext = urls.filter((u) => !SOCIAL_HOST_RE.test(u));
  return ext[0] ?? null;
}

export function postBodyNeedsThreadApplyLink(bodyText: string): boolean {
  const text = bodyText.toLowerCase();
  if (THREAD_LINK_HINT_RE.test(text)) return true;
  if (/apply\s+now\s*!?\s*👇/i.test(bodyText) && extractUrlsFromPostText(bodyText).length === 0) {
    return true;
  }
  return false;
}

export function resolveApplyUrlFromPostBody(bodyText: string): string | null {
  return pickBestApplyUrl(extractUrlsFromPostText(bodyText));
}

const AGGREGATOR_RE =
  /\b(jobs?\s*for\s*devs|remote\s*ok|remote\s*code\s*&\s*design|jobswithdexa|crypto\s*vazima|allweb3jobs|hiring\s*alert)\b/i;

export function isJobAggregatorContext(authorName: string, bodyText: string): boolean {
  const haystack = `${authorName} ${bodyText}`.toLowerCase();
  return AGGREGATOR_RE.test(haystack);
}